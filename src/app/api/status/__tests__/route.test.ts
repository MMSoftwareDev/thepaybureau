import { GET } from '../route'

// Save original env
const originalEnv = process.env

beforeEach(() => {
  jest.restoreAllMocks()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('GET /api/status', () => {
  it('returns 503 when UPTIMEROBOT_API_KEY is not set', async () => {
    delete process.env.UPTIMEROBOT_API_KEY

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toBe('UptimeRobot API key not configured')
  })

  it('returns monitors array on success', async () => {
    process.env.UPTIMEROBOT_API_KEY = 'test-key'

    const mockMonitors = [
      { id: 1, friendly_name: 'App', status: 2, url: 'https://app.test.com' },
      { id: 2, friendly_name: 'API', status: 2, url: 'https://api.test.com' },
    ]

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stat: 'ok', monitors: mockMonitors }),
    }) as jest.Mock

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.monitors).toHaveLength(2)
    expect(body.monitors[0]).toEqual({
      id: 1,
      name: 'App',
      status: 2,
      url: 'https://app.test.com',
    })
  })

  it('returns 502 when UptimeRobot API returns error', async () => {
    process.env.UPTIMEROBOT_API_KEY = 'test-key'

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stat: 'fail', error: { message: 'Bad key' } }),
    }) as jest.Mock

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error).toBe('Failed to fetch status')
  })

  it('returns 502 when fetch fails', async () => {
    process.env.UPTIMEROBOT_API_KEY = 'test-key'

    global.fetch = jest.fn().mockRejectedValue(
      new Error('Network error')
    ) as jest.Mock

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error).toBe('Failed to fetch status')
  })
})
