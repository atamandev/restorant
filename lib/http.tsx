/**
 * HTTP utility functions for API calls
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * GET request
 */
export async function get<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('GET request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارتباط با سرور',
    }
  }
}

/**
 * POST request
 */
export async function post<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('POST request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارتباط با سرور',
    }
  }
}

/**
 * PATCH request
 */
export async function patch<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('PATCH request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارتباط با سرور',
    }
  }
}

/**
 * DELETE request
 */
export async function remove<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('DELETE request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارتباط با سرور',
    }
  }
}

