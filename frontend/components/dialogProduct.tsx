import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { Product } from "./product";
import type { Product as ProductType } from "@/types/product";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { getWhatsAppTarget } from "@/lib/backendApi";
import { useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";
import Image from "next/image";

export const DialogProduct = (props: { product: ProductType }): JSX.Element => {
  const product = props.product;
  const [textArea, setTextArea] = useState("");
  const [loadingTextArea, setLoadingTextArea] = useState(true);

  const [sending, setSending] = useState<'Enviando' | 'Enviado' | 'Erro' | 'Enviar'>('Enviar');
  const messagingBaseUrl =
    process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:4000";

  return (
    <li key={product.product_id} className="flex-1">
      <Dialog key={product.product_id}>
        <DialogTrigger
          onClick={async () => {
            setLoadingTextArea(true);
            try {
              const response = await fetch(
                `/api/ali?type=affiliate-link&product_detail_url=${encodeURIComponent(product.product_detail_url)}`
              );
              console.log(`response`, response);
              if (!response.ok) {
                throw new Error("Failed to generate affiliate link");
              }

              const { promotionLink } = await response.json();

              setTextArea(`
                🔥 ${product.product_title}
                \n❌ De:   <s>R$ ${product.target_original_price}</s>    
✅ Por: R$ ${product.target_app_sale_price} 😱😱
${product.promo_code_info ? `\n🏷️ <b>Cupom</b>:<code>${product.promo_code_info.promo_code}</code>,\n` : ''}
🛒 ${promotionLink}
                \n😎🚀 Para mais ofertas, acesse: https://t.me/top_ofertas_online
                `.trim());

              setLoadingTextArea(false);
            } catch {
              // affiliate link generation error
            }
          }}
        >
          <Product product={product} />
        </DialogTrigger>
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogTitle>
            <Image
              src={product.product_main_image_url}
              alt={product.product_title}
              width={500}
              height={500}
              className="object-contain aspect-square w-full "
            />
          </DialogTitle>
          <DialogHeader>
            {!loadingTextArea ? (
              <Textarea
                cols={50}
                rows={10}
                value={textArea}
                onChange={(el) => {
                  setTextArea(el.target.value);
                }}
                className=""
              ></Textarea>
            ) : (
              <p>...</p>
            )}
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={async () => {
                setSending('Enviando');
                const promises: Promise<void>[] = [];

                promises.push(
                  fetch(`${messagingBaseUrl}/telegram/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chatId: -1002399025968,
                      photoUrl: product.product_main_image_url,
                      caption: textArea,
                    }),
                  }).then((r) => {
                    if (!r.ok) throw new Error();
                  })
                );

                const whatsappTarget = await getWhatsAppTarget();
                if (whatsappTarget) {
                  promises.push(
                    fetch(`${messagingBaseUrl}/whatsapp/send`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        to: whatsappTarget,
                        imageUrl: product.product_main_image_url,
                        caption: textArea,
                      }),
                    }).then((r) => {
                      if (!r.ok) throw new Error();
                    })
                  );
                }

                const results = await Promise.allSettled(promises);
                const ok = results.some((r) => r.status === "fulfilled");
                setSending(ok ? "Enviado" : "Erro");
              }}
            >
              {sending}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
};
