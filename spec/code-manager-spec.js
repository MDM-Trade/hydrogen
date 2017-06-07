"use babel";

import * as CM from "../lib/code-manager";
import { Point, Range } from "atom";

describe("CodeManager", () => {
  let editor;
  beforeEach(() => {
    editor = atom.workspace.buildTextEditor();
  });

  describe("Convert line endings", () => {
    it("should replace CRLF and CR with LF line endings", () => {
      const string = "foo\nbar";
      expect(CM.normalizeString("foo\nbar")).toEqual(string);
      expect(CM.normalizeString("foo\r\nbar")).toEqual(string);
      expect(CM.normalizeString("foo\rbar")).toEqual(string);
    });
  });

  describe("Get code", () => {
    // normalizeString should be called
    // beforeEach(() => spyOn(CM, 'normalizeString'));
    // afterEach(() => expect(CM.normalizeString).toHaveBeenCalled());

    it("getRow", () => {
      spyOn(editor, "lineTextForBufferRow");
      CM.getRow(editor, 123);
      expect(editor.lineTextForBufferRow).toHaveBeenCalledWith(123);
    });

    it("getRows", () => {
      spyOn(editor, "getTextInBufferRange");
      CM.getRows(editor, 1, 10);
      const range = {
        start: {
          row: 1,
          column: 0
        },
        end: {
          row: 10,
          column: 9999999
        }
      };
      expect(editor.getTextInBufferRange).toHaveBeenCalledWith(range);
    });

    it("getTextInRange", () => {
      spyOn(editor, "getTextInBufferRange");
      CM.getTextInRange(editor, [1, 2], [3, 4]);
      expect(editor.getTextInBufferRange).toHaveBeenCalledWith([
        [1, 2],
        [3, 4]
      ]);
    });

    it("getSelectedText", () => {
      spyOn(editor, "getSelectedText");
      CM.getSelectedText(editor);
      expect(editor.getSelectedText).toHaveBeenCalled();
    });
  });

  describe("cells", () => {
    const toPoint = point => Point.fromObject(point);
    const toRange = range => Range.fromObject(range);

    describe("getCellsForBreakPoints", () => {
      it("return cell(range) from array of points", () => {
        const points = [[1, 2], [3, 4], [5, 6], [10, 5]];
        const cell1 = [[1, 2], [3, 4]];
        const cell2 = [[4, 0], [5, 6]];
        const cell3 = [[6, 0], [10, 5]];
        const cellsExpected = [cell1, cell2, cell3].map(toRange);
        const cellsActual = CM.getCellsForBreakPoints(points.map(toPoint));
        expect(cellsActual).toEqual(cellsExpected);
      });
    });
    describe("getCells", () => {
      // runAsync is borrowed and modified from link below.
      // https://github.com/jasmine/jasmine/issues/923#issuecomment-169634461
      function waitAsync(fn) {
        return done => {
          fn().then(done, function rejected(e) {
            fail(e);
            done();
          });
        };
      }
      beforeEach(
        waitAsync(async () => {
          await atom.packages.activatePackage("language-javascript");
          const jsGrammar = atom.grammars.grammarForScopeName("source.js");
          editor.setGrammar(jsGrammar);
          const code = "var v1 = 1; // %%\nvar v2 = 2;\nvar v2 = 3; // %%\n";
          editor.setText(code);
        })
      );
      describe("no arg", () => {
        it("return cell(range) by collecting breakpoints from comments in editor", () => {
          const cell1 = [[0, 0], [0, 12]];
          const cell2 = [[1, 0], [2, 12]];
          const cell3 = [[3, 0], [3, 0]];
          const cellsActual = CM.getCells(editor);
          const cellsExpected = [cell1, cell2, cell3].map(toRange);
          expect(cellsActual).toEqual(cellsExpected);
        });
      });
      describe("with arg(= oldBreakpoints)", () => {
        it("return cells(range) from exising and detected breakpoints", () => {
          oldBreakpoints = [[1, 12], [2, 12]];
          const cell1 = [[0, 0], [0, 12]];
          const cell2 = [[1, 0], [1, 12]];
          const cell3 = [[2, 0], [2, 12]];
          const cell4 = [[3, 0], [3, 0]];
          const cellsActual = CM.getCells(editor, oldBreakpoints.map(toPoint));
          const cellsExpected = [cell1, cell2, cell3, cell4].map(toRange);
          expect(cellsActual).toEqual(cellsExpected);
        });
      });
    });
  });
});
