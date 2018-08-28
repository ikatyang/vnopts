import { Logger, normalize, Schema } from '../../src';

interface FakeLogger extends Logger {
  clearMessages: () => void;
  getMessages: () => string[];
}

export function createLogger(): FakeLogger {
  const messages: string[] = [];
  return {
    warn: message => messages.push(message),
    clearMessages: () => messages.splice(0, messages.length),
    getMessages: () => messages,
  };
}

export function eachHandler<$Schema extends Schema<any>>(
  SchemaConstructor: {
    create: (parameters: $Schema['_parametersType']) => $Schema;
  },
  schemaConstructorParameters: $Schema['_parametersType'],
  {
    logger = createLogger(),
    schemas: predefinedSchemas = [],
  }: { logger?: FakeLogger; schemas?: Array<Schema<any>> } = {},
) {
  return ({ parameters, input, output, hasWarnings }: any) => {
    const schemaParameters = {
      // @ts-ignore
      ...schemaConstructorParameters,
      ...parameters,
    };
    const opts = { logger, unknown: parameters.unknown };

    const title = `schema ${JSON.stringify(
      schemaParameters,
    )} with input ${JSON.stringify(input)}`;

    test(title, () => {
      logger.clearMessages();

      const schemas = [
        SchemaConstructor.create(schemaParameters),
        ...predefinedSchemas,
      ];

      if (output === Error) {
        expect(() =>
          normalize(input, schemas, opts),
        ).toThrowErrorMatchingSnapshot();
      } else {
        expect(normalize(input, schemas, opts)).toEqual(output);
      }

      const messages = logger.getMessages();
      if (hasWarnings) {
        expect(messages).not.toHaveLength(0);
        expect(messages).toMatchSnapshot();
      } else {
        expect(messages).toHaveLength(0);
      }
    });
  };
}
