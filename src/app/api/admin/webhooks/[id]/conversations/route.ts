import { requireAdmin } from '@/lib/auth/admin-guard';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Recent delivery attempts for one webhook endpoint — status, HTTP result,
// and the raw request/response bodies. Loaded on demand from the admin
// webhooks page rather than upfront for every endpoint.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const provider = getTelecomProvider();
  const conversations = await provider.listWebhookConversations(id).catch(() => []);
  return Response.json({ conversations });
}
