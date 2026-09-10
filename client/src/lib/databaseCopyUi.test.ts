import assert from "node:assert/strict";
import test from "node:test";
import {
  getDatabaseCopyUiStatus,
  shouldShowDatabaseOperations,
} from "./databaseCopyUi";

test("mostra operações do banco somente quando o acesso é autorizado", () => {
  assert.equal(shouldShowDatabaseOperations(true), true);
  assert.equal(shouldShowDatabaseOperations(false), false);
  assert.equal(shouldShowDatabaseOperations(undefined), false);
});

test("representa os estados idle, running, success e error", () => {
  assert.equal(getDatabaseCopyUiStatus(undefined, false), "idle");
  assert.equal(getDatabaseCopyUiStatus(undefined, true), "running");
  assert.equal(getDatabaseCopyUiStatus("running", false), "running");
  assert.equal(getDatabaseCopyUiStatus("success", false), "success");
  assert.equal(getDatabaseCopyUiStatus("error", false), "error");
});