export interface ShortenRequest {
  url: string;
}

export interface ShortenResponse {
  code: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
}

export interface StatsResponse {
  code: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
