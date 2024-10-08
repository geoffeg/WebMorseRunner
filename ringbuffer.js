class RingBuffer {
    constructor(sab, type) {
        this._capacity = (sab.byteLength - 8) / type.BYTES_PER_ELEMENT;
        this._type = type;
        this.buf = sab;
        this.write_ptr = new Uint32Array(this.buf, 0, 1);
        this.read_ptr = new Uint32Array(this.buf, 4, 1);
        this.storage = new type(this.buf, 8, this._capacity);
    }

    push(elements, length, offset = 0) {
        const rd = Atomics.load(this.read_ptr, 0);
        const wr = Atomics.load(this.write_ptr, 0);

        if ((wr + 1) % this._capacity === rd) {
            // full
            return 0;
        }

        const len = length !== undefined ? length : elements.length;

        const to_write = Math.min(this._available_write(rd, wr), len);
        const first_part = Math.min(this._capacity - wr, to_write);
        const second_part = to_write - first_part;

        this._copy(elements, offset, this.storage, wr, first_part);
        this._copy(elements, offset + first_part, this.storage, 0, second_part);

        // publish the enqueued data to the other side
        Atomics.store(
            this.write_ptr,
            0,
            (wr + to_write) % this._capacity,
        );

        return to_write;
    }
    pop(elements, length, offset = 0) {
        const rd = Atomics.load(this.read_ptr, 0);
        const wr = Atomics.load(this.write_ptr, 0);

        if (wr === rd) {
            return 0;
        }

        const len = length !== undefined ? length : elements.length;
        const to_read = Math.min(this._available_read(rd, wr), len);

        const first_part = Math.min(this._storage_capacity() - rd, to_read);
        const second_part = to_read - first_part;

        this._copy(this.storage, rd, elements, offset, first_part);
        this._copy(this.storage, 0, elements, offset + first_part, second_part);

        Atomics.store(this.read_ptr, 0, (rd + to_read) % this._storage_capacity());

        return to_read;
    }
    empty() {
        const rd = Atomics.load(this.read_ptr, 0);
        const wr = Atomics.load(this.write_ptr, 0);

        return wr === rd;
    }
    full() {
        const rd = Atomics.load(this.read_ptr, 0);
        const wr = Atomics.load(this.write_ptr, 0);

        return (wr + 1) % this._storage_capacity() === rd;
    }
    capacity() {
        return this._capacity - 1;
    }
    availableRead() {
        const rd = Atomics.load(this.read_ptr, 0);
        const wr = Atomics.load(this.write_ptr, 0);
        return this._available_read(rd, wr);
    }
    availableWrite() {
        const rd = Atomics.load(this.read_ptr, 0);
        const wr = Atomics.load(this.write_ptr, 0);
        return this._available_write(rd, wr);
    }

    _available_read(rd, wr) {
        return (wr + this._capacity - rd) % this._capacity;
    }

    _available_write(rd, wr) {
        return this.capacity() - this._available_read(rd, wr);
    }
    _copy(input, offset_input, output, offset_output, size) {
        for (let i = 0; i < size; i++) {
            output[offset_output + i] = input[offset_input + i];
        }
    }
}
export { RingBuffer }