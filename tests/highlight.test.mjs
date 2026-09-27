// LYD-60: npm test  (Node >= 23: importa .ts con type stripping nativo)
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contactMatches, splitHighlight } from "../src/lib/highlight.ts";

describe("splitHighlight", () => {
  it("marca todas las apariciones sin importar mayusculas", () => {
    assert.deepEqual(splitHighlight("Precio del curso, PRECIO final", "precio"), [
      { text: "Precio", match: true },
      { text: " del curso, ", match: false },
      { text: "PRECIO", match: true },
      { text: " final", match: false },
    ]);
  });

  it("sin query devuelve el texto entero sin resaltar", () => {
    assert.deepEqual(splitHighlight("hola", "  "), [{ text: "hola", match: false }]);
  });

  it("texto vacio no genera tramos", () => {
    assert.deepEqual(splitHighlight("", "hola"), []);
  });

  it("sin coincidencia devuelve un solo tramo", () => {
    assert.deepEqual(splitHighlight("hola mundo", "xyz"), [{ text: "hola mundo", match: false }]);
  });
});

describe("contactMatches", () => {
  it("matchea por nombre", () => {
    assert.equal(contactMatches("mar", "Maria Lopez", null), true);
  });

  it("matchea telefono ignorando espacios y signos", () => {
    assert.equal(contactMatches("+51 987 654", "Sin nombre", "51987654321"), true);
  });

  it("no matchea telefono con menos de 3 digitos", () => {
    assert.equal(contactMatches("98", "Juan", "51987654321"), false);
  });

  it("no matchea si nada coincide", () => {
    assert.equal(contactMatches("pedro", "Juan", "51987654321"), false);
  });
});
