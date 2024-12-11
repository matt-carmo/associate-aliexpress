import { generateAffiliateLink } from "@/lib/services";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { Product } from "./product";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { sendPhoto } from "@/app/services/sendPhoto";
import { useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";
import Image from "next/image";

export const DialogProduct = (props: { product: Product }): JSX.Element => {
  const product = props.product;
  const [textArea, setTextArea] = useState("");
  const [loadingTextArea, setLoadingTextArea] = useState(true);
  
  const [sending, setSending] = useState<'Enviando' | 'EnViado' | 'Erro' | 'Enviar'>('Enviar');

  return (
    <li key={product.product_id} className="flex-1">
      <Dialog key={product.product_id}>
        <DialogTrigger
          onClick={async () => {
            setLoadingTextArea(true);
            try {
              const afiliateLink = await generateAffiliateLink({
                product_detail_url: product.product_detail_url,
              });

              setTextArea(`
                🔥 ${product.product_title}
                \n❌ De:   <s>R$ ${product.target_original_price}</s>    
✅ Por: R$ ${product.target_app_sale_price} 😱😱
${product.promo_code_info ? `\n🏷️ <b>Cupom</b>:<code>${product.promo_code_info.promo_code}</code>,\n` : ''}
🛒 ${afiliateLink}
                \n😎🚀 Para mais ofertas, acesse: ...
                `.trim());
                                
              setLoadingTextArea(false);
            } catch (error) {
              console.log(error);
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
          <DialogFooter>
            <Button
              onClick={() => {
                setSending('Enviando');
                sendPhoto({
                  text: textArea,
                  photoUrl: product.product_main_image_url,
                  chatId: -1002399025968,
                })
                  .then(() => {
                    setSending('EnViado');
                  })
                  .catch((error) => {
                    setSending('Erro');
                  });
               
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
