import type { DiscoveryProduct } from "./discoveryProduct";

export type TemplateKey = "padrao" | "simples" | "com_cupom" | "relampago";

export const TEMPLATES: Record<
  TemplateKey,
  {
    label: string;
    generate: (product: DiscoveryProduct, link: string) => string;
  }
> = {
  padrao: {
    label: "Padrão",
    generate: (product, link) => {
      const priceLabel =
        product.priceMax && product.priceMax > (product.price || 0)
          ? "A partir de: R$"
          : "Por: R$";
      return [
        `🔥 ${product.title}`,
        "",
        `❌ De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `✅ ${priceLabel} ${product.price?.toFixed(2) ?? "?"} 😱😱`,
        ...(product.promoCode
          ? [`\n🏷️ <b>Cupom</b>: <code>${product.promoCode}</code>`]
          : []),
        "",
        `🛒 ${link}`,
        "",
        "😎🚀 Para mais ofertas, acesse: https://t.me/top_ofertas_online",
      ].join("\n");
    },
  },
  simples: {
    label: "Simples",
    generate: (product, link) => {
      const priceLabel =
        product.priceMax && product.priceMax > (product.price || 0)
          ? "A partir de R$"
          : "R$";
      return [
        `📦 ${product.title}`,
        `💰 ${priceLabel} ${product.price?.toFixed(2) ?? "?"}`,
        `🔗 ${link}`,
      ].join("\n");
    },
  },
  com_cupom: {
    label: "Com Cupom",
    generate: (product, link) => {
      if (!product.promoCode) {
        return TEMPLATES.padrao.generate(product, link);
      }
      const priceLabel =
        product.priceMax && product.priceMax > (product.price || 0)
          ? "A partir de: R$"
          : "Por: R$";
      return [
        "🏷️ CUPOM ESPECIAL 🏷️",
        "",
        `🔥 ${product.title}`,
        `❌ De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `✅ ${priceLabel} ${product.price?.toFixed(2) ?? "?"}`,
        `🎫 Cupom: <code>${product.promoCode}</code>`,
        "",
        `🛒 ${link}`,
        "",
        "⏳ Oferta por tempo limitado!",
      ].join("\n");
    },
  },
  relampago: {
    label: "Promoção Relâmpago",
    generate: (product, link) => {
      const original = product.originalPrice ?? 0;
      const current = product.price ?? 0;

      const hasDiscount = original > current;
      const savings = hasDiscount ? original - current : 0;
      const discount = hasDiscount ? (savings / original) * 100 : 0;

      const priceLabel =
        product.priceMax && product.priceMax > current
          ? "A partir de"
          : "Por apenas";

      const formatPrice = (value: number) =>
        value.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      return [
        "⚡ PROMOÇÃO RELÂMPAGO ⚡",
        "",
        `🛍️ ${product.title}`,
        "",
        hasDiscount ? `💥 De: ~R$ ${formatPrice(original)}~` : null,
        `🔥 ${priceLabel}: *R$ ${formatPrice(current)}*`,
        hasDiscount
          ? `💸 Economize R$ ${formatPrice(savings)} (${discount.toFixed(0)}% OFF)`
          : null,
        "",
        `🛒 ${link}`,
        "",
        "🚨 Estoque limitado! Aproveite antes que o preço mude.",
      ]
        .join("\n");
    },
  },
};
