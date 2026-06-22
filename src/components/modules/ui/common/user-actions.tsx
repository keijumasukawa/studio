"use client";

import { LogInIcon } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export const UserActions = () => {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            <LogInIcon className="size-4" />
            Sign in
          </Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
};
