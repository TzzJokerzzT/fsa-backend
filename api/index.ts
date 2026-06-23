export default {
  async fetch(request) {
    return new Response(JSON.stringify({ 
      status: "ok",
      path: new URL(request.url).pathname,
      time: new Date().toISOString()
    }), {
      headers: { "content-type": "application/json" }
    });
  }
}
