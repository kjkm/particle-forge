export default class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Uint32Array(width * height);
    }

    Get(x, y) {
        return this.cells[y * this.width + x];
    }

    Set(x, y, value) {
        this.cells[y * this.width + x] = value;
    }

    Clear() {
        this.cells.fill(0);
    }

    Randomize() {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = Math.random() < 0.5 ? 0 : 1;
        }
    }

    GetArray() {
        return this.cells;
    }

    SetArray(array) {
        this.cells = array;
    }
}