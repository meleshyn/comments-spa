const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * API Response Types based on the backend API specification
 */
export interface Attachment {
  id: string;
  commentId: string;
  fileUrl: string;
  fileType: 'image' | 'text';
}

export interface Comment {
  id: string;
  userName: string;
  email: string;
  homePage?: string;
  text: string;
  parentId?: string;
  createdAt: string;
  repliesCount: number;
  attachments: Attachment[];
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
   * Create a new comment with optional file attachments
   */
  async createComment(data: {
    userName: string;
    email: string;
    homePage?: string;
    text: string;
    parentId?: string;
    captchaToken: string;
    files?: File[];
  }): Promise<Comment> {
    // Create FormData for multipart upload
    const formData = new FormData();

    // Append text fields
    formData.append('userName', data.userName);
    formData.append('email', data.email);
    formData.append('text', data.text);
    formData.append('captchaToken', data.captchaToken);

    if (data.homePage) {
      formData.append('homePage', data.homePage);
    }

    if (data.parentId) {
      formData.append('parentId', data.parentId);
    }

    // Append files
    if (data.files) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const url = `${this.baseUrl}/comments`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
