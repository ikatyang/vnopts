import { expect } from 'vitest'
import serializerAnsi from 'jest-snapshot-serializer-ansi'

expect.addSnapshotSerializer(serializerAnsi)
