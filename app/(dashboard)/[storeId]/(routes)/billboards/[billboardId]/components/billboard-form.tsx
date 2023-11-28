"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { Billboard } from "@prisma/client";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { UploadDropzone } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { AlertModal } from "@/components/modals/alert-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Configure zod language
import i18next from "i18next";
import { zodI18nMap } from "zod-i18n-map";
import translation from "zod-i18n-map/locales/PT/zod.json"; // Import portuguese language translation files

i18next.init({
  lng: "pt",
  resources: {
    pt: { zod: translation },
  },
});
z.setErrorMap(zodI18nMap);

const formSchema = z.object({
  label: z.string().min(1),
  imageUrl: z.string().refine((data) => data.length > 0, {
    message: "A imagem é obrigatória.",
  }),
});

type BillboardFormValues = z.infer<typeof formSchema>;

interface BillboardFormProps {
  initialData: Billboard | null;
}

export const BillboardForm: React.FC<BillboardFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();

  const [openDelete, setOpenDelete] = useState(false);
  const [openRemoveImage, setOpenRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const title = initialData ? "Editar painel" : "Criar painel";
  const description = initialData
    ? "Editar um painel publicitário"
    : "Criar um novo painel";
  const toastMessageSuccess = initialData
    ? "Painel atualizado com sucesso."
    : "Painel criado com sucesso!";
  const toastMessageError = initialData
    ? "Alco correu mal ao atualizar o painel!"
    : "Alco correu mal ao criar o painel!";
  const action = initialData ? "Guardar alterações" : "Criar";

  const form = useForm<BillboardFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      label: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: BillboardFormValues) => {
    try {
      // console.log(data);
      setLoading(true);
      if (initialData) {
        // Edit
        await axios.patch(
          `/api/${params.storeId}/billboards/${params.billboardId}`,
          data
        );
      } else {
        // Create
        await axios.post(`/api/${params.storeId}/billboards`, data);
      }
      router.push(`/${params.storeId}/billboards`);
      router.refresh();
      toast.success(toastMessageSuccess);
    } catch (error) {
      toast.error(toastMessageError);
    } finally {
      setLoading(false);
    }
  };

  // It won't be possible to delete the store with products and categories in it.
  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/billboards/${params.billboardId}`
      );
      toast.success("Painel apagado com sucesso.");
      router.push(`/${params.storeId}/billboards`);
      router.refresh();
    } catch (error) {
      toast.error(
        "Certifique-se que remove todas as categorias que usam este painel, antes de o apagar."
      );
    } finally {
      setLoading(false);
      setOpenDelete(false);
    }
  };

  // Event trigger when edit image
  const onRemoveImage = async (imageUrl: string) => {
    try {
      setLoading(true);
      await axios.delete("/api/uploadthing", {
        data: {
          url: imageUrl,
        },
      });

      // I'm using 'window.location.assign' instead of 'router.refresh()', because it ensures a full refresh
      // toast.success("Imagem apagada com sucesso.");
      // router.refresh();
      window.location.assign(
        `/${params.storeId}/billboards/${params.billboardId}`
      );
    } catch (error) {
      console.log(error);
      toast.error("Ocorreu um erro inesperado ao apagar a imagem.");
    } finally {
      setLoading(false);
      setOpenRemoveImage(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onDelete}
        loading={loading}
        buttonLabel="Apagar painel"
        description="O painel será permanentemente eliminado. Esta operação não pode ser revertida."
      />
      <AlertModal
        isOpen={openRemoveImage}
        onClose={() => setOpenRemoveImage(false)}
        onConfirm={() => onRemoveImage(imageUrl)}
        loading={loading}
        buttonLabel="Apagar imagem"
        description="A imagem será permanentemente eliminada. Esta operação não pode ser revertida."
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpenDelete(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem</FormLabel>
                  <FormControl>
                    {imageUrl || field.value ? (
                      <div>
                        <Image
                          src={imageUrl || field.value}
                          alt="billboard image"
                          width={1920}
                          height={1080}
                          className="object-cover border-2 rounded-md border-dashed bg-[f8fafc] border-[c3c5c9]"
                          priority
                        />
                        <Button
                          disabled={loading}
                          variant="destructive"
                          onClick={() => {
                            setImageUrl(field.value);
                            setOpenRemoveImage(true);
                          }}
                          type="button"
                          className="ml-auto mt-2"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Remover imagem
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <UploadDropzone
                          className="bg-zinc-100 ut-label:text-sm ut-allowed-content:ut-uploading:text-red-400"
                          endpoint="billboardImage"
                          onClientUploadComplete={(res) => {
                            console.log("Uploaded imagem: ", res[0].url);
                            setImageUrl(res[0].url);
                            field.onChange(res[0].url);
                          }}
                          onUploadError={(error: Error) => {
                            toast.error("Só é possível enviar uma imagem!");
                            console.log(error);
                          }}
                        />
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Nome do painel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
