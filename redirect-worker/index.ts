export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // Redirect all traffic from the old workers.dev domain to the active smartko.shop domain
    url.hostname = 'smartko.shop';
    return Response.redirect(url.toString(), 301);
  },
};
