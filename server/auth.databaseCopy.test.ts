import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { isSuperAdmin, isSuperAdminUser } from "./auth";

test("reconhece somente administradores da lista de super admins", () => {
  assert.equal(
    isSuperAdminUser({
      role: "admin",
      email: "adm@senseisystem.com.br",
    }),
    true,
  );
  assert.equal(
    isSuperAdminUser({
      role: "instructor",
      email: "adm@senseisystem.com.br",
    }),
    false,
  );
  assert.equal(
    isSuperAdminUser({
      role: "admin",
      email: "admin-comum@example.test",
    }),
    false,
  );
});

test("middleware rejeita chamada de usuário sem permissão", () => {
  let statusCode = 200;
  let responseBody: unknown;
  let nextCalled = false;
  const request = {
    isAuthenticated: () => true,
    user: {
      role: "admin",
      email: "admin-comum@example.test",
    },
  } as Request;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  isSuperAdmin(request, response, next);

  assert.equal(statusCode, 403);
  assert.deepEqual(responseBody, {
    message: "Forbidden: Super admin access required",
  });
  assert.equal(nextCalled, false);
});