import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNoDatabaseCopyInProgress,
  filterSafeRestoreList,
  shouldGuardDatabaseMutation,
  validateDatabaseCopyEnvironment,
} from "./databaseCopyService";

const developmentUrl = "postgresql://dev:secret@dev.example.test:5432/development";
const productionUrl = "postgresql://prod:secret@prod.example.test:5432/production";

test("bloqueia a operação no ambiente de produção", () => {
  assert.throws(
    () =>
      validateDatabaseCopyEnvironment({
        NODE_ENV: "production",
        PROD_DATABASE_URL: productionUrl,
        DATABASE_URL: developmentUrl,
      }),
    /só pode.*desenvolvimento/i,
  );
});

test("exige as duas configurações de banco", () => {
  assert.throws(
    () =>
      validateDatabaseCopyEnvironment({
        NODE_ENV: "development",
        DATABASE_URL: developmentUrl,
      }),
    /produção não está configurado/i,
  );
  assert.throws(
    () =>
      validateDatabaseCopyEnvironment({
        NODE_ENV: "development",
        PROD_DATABASE_URL: productionUrl,
      }),
    /desenvolvimento não está configurado/i,
  );
});

test("bloqueia origem e destino iguais mesmo com credenciais diferentes", () => {
  assert.throws(
    () =>
      validateDatabaseCopyEnvironment({
        NODE_ENV: "development",
        PROD_DATABASE_URL: "postgresql://reader:a@db.example.test/app",
        DATABASE_URL: "postgresql://writer:b@db.example.test:5432/app",
      }),
    /mesmo banco/i,
  );
});

test("aceita bancos de produção e desenvolvimento diferentes", () => {
  assert.deepEqual(
    validateDatabaseCopyEnvironment({
      NODE_ENV: "development",
      PROD_DATABASE_URL: productionUrl,
      DATABASE_URL: developmentUrl,
    }),
    {
      sourceUrl: productionUrl,
      destinationUrl: developmentUrl,
    },
  );
});

test("impede duas operações simultâneas", () => {
  assert.doesNotThrow(() => assertNoDatabaseCopyInProgress(null));
  assert.throws(
    () => assertNoDatabaseCopyInProgress("job-em-andamento"),
    /já existe.*andamento/i,
  );
});

test("preserva o schema e as sessões locais durante a restauração", () => {
  const restoreList = [
    "4; 2615 2200 SCHEMA - public pg_database_owner",
    "5; 0 0 COMMENT - SCHEMA public pg_database_owner",
    "10; 1259 100 TABLE public users owner",
    "11; 1259 101 TABLE public session owner",
    "12; 0 101 TABLE DATA public session owner",
    "13; 2606 101 CONSTRAINT public session session_pkey owner",
    "14; 1259 102 INDEX public IDX_session_expire owner",
    "15; 0 100 TABLE DATA public users owner",
  ].join("\n");

  const filtered = filterSafeRestoreList(restoreList);

  assert.match(filtered, /TABLE public users/);
  assert.match(filtered, /TABLE DATA public users/);
  assert.doesNotMatch(filtered, /SCHEMA - public/);
  assert.doesNotMatch(filtered, /SCHEMA public/);
  assert.doesNotMatch(filtered, /public session/);
  assert.doesNotMatch(filtered, /IDX_session_/);
});

test("não abre lock de manutenção quando a cópia está indisponível", () => {
  assert.equal(
    shouldGuardDatabaseMutation("POST", "/api/login", false),
    false,
  );
  assert.equal(
    shouldGuardDatabaseMutation("POST", "/api/login", true),
    true,
  );
  assert.equal(
    shouldGuardDatabaseMutation(
      "POST",
      "/api/admin/database/prod-to-dev",
      true,
    ),
    false,
  );
  assert.equal(
    shouldGuardDatabaseMutation("GET", "/api/users/pending", true),
    false,
  );
});