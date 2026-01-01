"use client";

import { Button } from "@/components/ui/button";
import { syne } from "@/fonts/fonts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Code2, Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Page Not Found - AnchorLabs";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center p-6"
    >
      <div className="max-w-2xl w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20"
          >
            <Code2 className="h-10 w-10 text-primary" />
          </motion.div>

          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn("text-6xl lg:text-7xl font-bold", syne)}
            >
              404
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn("text-2xl lg:text-3xl font-semibold text-foreground", syne)}
            >
              Page Not Found
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-base lg:text-lg text-muted-foreground max-w-md mx-auto"
            >
              The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            onClick={() => router.back()}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto gap-2 h-11 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push("/")}
            size="lg"
            className="w-full sm:w-auto gap-2 h-11 font-medium"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto gap-2 h-11 font-medium"
          >
            <Search className="h-4 w-4" />
            Dashboard
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-2 pt-8"
        >
          <Code2 className="h-5 w-5 text-muted-foreground" />
          <span className={cn("text-lg font-bold text-muted-foreground", syne)}>
            AnchorLabs
          </span>
          <span className="text-sm text-muted-foreground">DevTool</span>
        </motion.div>
      </div>
    </motion.div>
  );
}