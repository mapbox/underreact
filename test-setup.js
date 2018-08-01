'use strict';

const serializer = require('jest-serializer-path');

expect.addSnapshotSerializer(serializer);
