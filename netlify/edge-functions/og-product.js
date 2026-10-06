// Netlify Edge Function: Dynamic Open Graph Previews for Products
// Intercepts requests with ?p=ID and injects real product images and titles for WhatsApp, Facebook, Instagram, Twitter, etc.

const SUPABASE_URL = "https://krbedelskftedoxqsmib.supabase.co";
const SUPABASE_KEY = "sb_publishable__ILuKmKH3_IpjxYrbDbUqg_oAOjygV0";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function (request, context) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("p") || url.searchParams.get("producto") || url.searchParams.get("id");

  // If no product query parameter, serve standard static page
  if (!productId) {
    return context.next();
  }

  // Get the normal response from Netlify
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  try {
    // Fetch product with a quick timeout (max 2 seconds) to avoid any slowdown
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const apiEndpoint = `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*`;
    const sbRes = await fetch(apiEndpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!sbRes.ok) {
      return response;
    }

    const prods = await sbRes.json();
    if (!prods || prods.length === 0) {
      return response;
    }

    const p = prods[0];
    const rawName = p.name || "Producto";
    const rawPrice = p.price && Number(p.price) > 0 ? `$${Number(p.price).toLocaleString("es-AR")}` : "Consultar precio";
    const rawDesc = p.description ? `${rawPrice} • ${p.description.slice(0, 150)}` : `${rawPrice} • Disponible en Rochi Accesorios`;

    // Determine the product image URL
    let rawImg = p.image_url;
    if (!rawImg && Array.isArray(p.image_urls) && p.image_urls.length > 0) {
      rawImg = p.image_urls[0];
    }
    if (!rawImg) {
      rawImg = "https://rochi.com.ar/logo.png";
    }

    const title = escapeHtml(`${rawName} | Rochi Accesorios`);
    const description = escapeHtml(rawDesc);
    const imageUrl = escapeHtml(rawImg);
    const productUrl = escapeHtml(request.url);

    let html = await response.text();

    // Clean up existing tags that might duplicate
    html = html.replace(/<meta\s+property=["']og:image:secure_url["'][\s\S]*?>/gi, '');
    html = html.replace(/<link\s+rel=["']image_src["'][\s\S]*?>/gi, '');
    html = html.replace(/<meta\s+property=["']og:site_name["'][\s\S]*?>/gi, '');

    // Replace <title>
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

    // Replace existing meta tags
    html = html.replace(/<meta\s+property=["']og:title["'][\s\S]*?>/gi, `<meta property="og:title" content="${title}">\n  <meta property="og:site_name" content="Rochi Accesorios">`);
    html = html.replace(/<meta\s+property=["']og:description["'][\s\S]*?>/gi, `<meta property="og:description" content="${description}">`);
    html = html.replace(/<meta\s+property=["']og:image["'][\s\S]*?>/gi, `<meta property="og:image" content="${imageUrl}">\n  <meta property="og:image:secure_url" content="${imageUrl}">\n  <link rel="image_src" href="${imageUrl}">`);
    html = html.replace(/<meta\s+property=["']og:url["'][\s\S]*?>/gi, `<meta property="og:url" content="${productUrl}">`);

    html = html.replace(/<meta\s+name=["']twitter:title["'][\s\S]*?>/gi, `<meta name="twitter:title" content="${title}">`);
    html = html.replace(/<meta\s+name=["']twitter:description["'][\s\S]*?>/gi, `<meta name="twitter:description" content="${description}">`);
    html = html.replace(/<meta\s+name=["']twitter:image["'][\s\S]*?>/gi, `<meta name="twitter:image" content="${imageUrl}">`);

    // Also update generic meta description
    html = html.replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, `<meta name="description" content="${description}">`);

    return new Response(html, {
      status: response.status,
      headers: response.headers,
    });
  } catch (_e) {
    // If Supabase fetch fails or times out, safely return original response
    return response;
  }
}
