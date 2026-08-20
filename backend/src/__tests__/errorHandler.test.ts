import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, errorHandler } from '../presentation/middlewares/errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('AppError', () => {
  it('should create an error with status code and message', () => {
    const error = new AppError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.isOperational).toBe(true);
  });

  it('should have isOperational as true by default', () => {
    const error = new AppError(500, 'Server error');
    expect(error.isOperational).toBe(true);
  });

  it('should extend Error', () => {
    const error = new AppError(400, 'Bad request');
    expect(error instanceof Error).toBe(true);
  });
});

describe('errorHandler', () => {
  const mockReq = {} as Request;
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const mockNext = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError(404, 'Not found');
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Not found',
      statusCode: 404
    });
  });

  it('should handle generic errors as 500', () => {
    const error = new Error('Unexpected error');
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      statusCode: 500
    });
  });
});
