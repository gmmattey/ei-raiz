import React from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const err = useRouteError();

  const message = (() => {
    if (isRouteErrorResponse(err)) return `${err.status} ${err.statusText}`;
    if (err instanceof Error) return err.message;
    return "Rota não encontrada.";
  })();

  return (
    <div className="min-h-dvh bg-bg-secondary text-text-primary">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-14">
        <p className="ty-caption text-text-secondary">Erro</p>
        <h1 className="ty-h1 font-display">Algo não abriu</h1>
        <p className="ty-body text-text-secondary">{message}</p>
        <div>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
