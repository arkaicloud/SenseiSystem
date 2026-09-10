import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNoDatabaseCopyInProgress,
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