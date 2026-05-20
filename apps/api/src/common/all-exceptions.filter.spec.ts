import { BadRequestException, NotFoundException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface FakeResponse {
  statusCode: number;
  body: unknown;
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
}

function makeHost(): { host: any; res: FakeResponse } {
  const res: FakeResponse = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  };
  return { host, res };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    // Silenciar el logger interno para no ensuciar la salida de tests.
    jest.spyOn((filter as unknown as { logger: { error: () => void } }).logger, 'error')
      .mockImplementation(() => undefined);
  });

  it('mapea HttpException string a {statusCode, message}', () => {
    const { host, res } = makeHost();
    filter.catch(new NotFoundException('no existe'), host as never);
    expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect((res.body as { message: string }).message).toBe('no existe');
  });

  it('mapea HttpException con cuerpo {message, issues}', () => {
    const { host, res } = makeHost();
    const ex = new BadRequestException({ message: 'invalido', issues: { foo: 'bar' } });
    filter.catch(ex, host as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      message: 'invalido',
      details: { foo: 'bar' },
    });
  });

  it('mapea Prisma P2002 (unique constraint) a 409', () => {
    const { host, res } = makeHost();
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Unique violation', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['email'] },
    });
    filter.catch(prismaErr, host as never);
    expect(res.statusCode).toBe(HttpStatus.CONFLICT);
    expect((res.body as { message: string }).message).toMatch(/ya existe/i);
  });

  it('mapea Prisma P2025 (record not found) a 404', () => {
    const { host, res } = makeHost();
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });
    filter.catch(prismaErr, host as never);
    expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('mapea Error generico a 500 sin filtrar mensaje interno', () => {
    const { host, res } = makeHost();
    filter.catch(new Error('algo de la base de datos confidencial'), host as never);
    expect(res.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect((res.body as { message: string }).message).toBe('Error interno');
  });
});
