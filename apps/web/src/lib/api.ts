const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * API Response Types based on the backend API specification
 */
export interface Comment {
  id: string;
  userName: string;
  email: string;
  homePage?: string;
  text: string;
  parentId?: string;
  createdAt: string;
  repliesCount: number;
}

export interface CommentsResponse {
  data: Comment[];
  nextCursor?: string;
}

export type SortBy = 'userName' | 'email' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

/**
 * API client configuration and utilities
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Fetch root comments with pagination and sorting
   * GET /comments
   */
  async getRootComments(
    params: {
      limit?: number;
      cursor?: string;
      sortBy?: SortBy;
      sortOrder?: SortOrder;
    } = {}
  ): Promise<CommentsResponse> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = `/comments${queryString ? `?${queryString}` : ''}`;

    return this.request<CommentsResponse>(endpoint);
  }

  /**
   * Fetch replies for a specific comment
   * GET /comments/:id/replies
   */
  async getCommentReplies(
    commentId: string,
    params: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<CommentsResponse> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.cursor) searchParams.set('cursor', params.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/comments/${commentId}/replies${queryString ? `?${queryString}` : ''}`;

    return this.request<CommentsResponse>(endpoint);
  }

  /**
   * Create a new comment
   */
  async createComment(data: {
    userName: string;
    email: string;
    homePage?: string;
    text: string;
    parentId?: string;
    captchaToken: string;
  }): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
