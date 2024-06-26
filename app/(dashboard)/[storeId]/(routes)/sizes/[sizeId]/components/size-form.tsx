"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { type Size } from "@prisma/client";
import { Ruler, Trash, Undo2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { AlertModal } from "@/components/modals/alert-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import translation from "zod-i18n-map/locales/pt/zod.json"; // Import portuguese language translation files

i18next.init({
  lng: "pt",
  resources: {
    pt: { zod: translation },
  },
});
z.setErrorMap(zodI18nMap);

const formSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9áéíóúâêîôûãõñç ]+$/, {
      message: "Texto deve conter apenas letras e números",
    })
    .refine((value) => value.trim() === value, {
      message: "Texto não pode conter espaços em branco no início ou no final",
    }),
  value: z
    .string()
    .min(1)
    .max(5)
    .regex(/^[a-zA-Z0-9áéíóúâêîôûãõñç ]+$/, {
      message: "Texto deve conter apenas letras e números",
    })
    .refine((value) => value.trim() === value, {
      message: "Texto não pode conter espaços em branco no início ou no final",
    }),
});

type SizeFormValues = z.infer<typeof formSchema>;

interface SizeFormProps {
  initialData: Size | null;
}

export const SizeForm: React.FC<SizeFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();

  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Editar tamanho" : "Criar tamanho";
  const description = initialData
    ? "Editar um tamanho"
    : "Criar um novo tamanho";
  const toastMessageSuccess = initialData
    ? "Tamanho atualizado com sucesso."
    : "Tamanho criado com sucesso!";
  const toastMessageError = initialData
    ? "Algo correu mal ao atualizar o tamanho!"
    : "Algo correu mal ao criar o tamanho!";
  const action = initialData ? "Guardar alterações" : "Criar";

  const form = useForm<SizeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      value: "",
    },
  });

  const onSubmit = async (data: SizeFormValues) => {
    try {
      setLoading(true);

      const endpoint = initialData
        ? `/api/${params.storeId}/sizes/${params.sizeId}`
        : `/api/${params.storeId}/sizes`;

      const method = initialData ? axios.patch : axios.post;

      await method(endpoint, data);

      router.push(`/${params.storeId}/sizes`);
      router.refresh();
      toast.success(toastMessageSuccess);
    } catch (error) {
      toast.error(toastMessageError);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);

      // Delete the size
      await axios.delete(`/api/${params.storeId}/sizes/${params.sizeId}`);

      toast.success("Tamanho apagado com sucesso.");
      router.push(`/${params.storeId}/sizes`);
      router.refresh();
    } catch (error) {
      toast.error(
        "Certifique-se que remove todos os produtos que usam este tamanho, antes de o apagar."
      );
    } finally {
      setLoading(false);
      setOpenDelete(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => {
          setOpenDelete(false);
        }}
        onConfirm={async () => {
          await onDelete();
        }}
        loading={loading}
        buttonLabel="Apagar tamanho"
        description="O tamanho será permanentemente eliminado. Esta operação não pode ser revertida."
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        <div className="flex items-center">
          <Button
            className="mx-2"
            onClick={() => {
              router.push(`/${params.storeId}/sizes`);
            }}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {initialData && (
            <Button
              disabled={loading}
              variant="destructive"
              size="sm"
              onClick={() => {
                setOpenDelete(true);
              }}
              className="mr-2"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator />
      <Alert>
        <Ruler className="h-4 w-4" />
        <AlertTitle>Guia de criação de Tamanhos</AlertTitle>
        <AlertDescription>
          Insira o nome do tamanho e a abreviatura correspondente.
          <br />
          Isso ajuda a garantir consistência e facilita a experiência de compra
          dos seus clientes.
          <blockquote className="p-4 my-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">
            <p className="font-medium leading-relaxed text-gray-900 dark:text-white">
              <b>Nome:</b> Pequeno
              <br />
              <b>Abreviatura:</b> S
            </p>
          </blockquote>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      disabled={loading}
                      placeholder="Nome do tamanho"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abreviatura</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      disabled={loading}
                      placeholder="Abreviatura do tamanho"
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
