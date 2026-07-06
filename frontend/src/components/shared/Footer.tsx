"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { AuthDialog } from "@/components/shared/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";

export const Footer = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-card border-t border-border mt-14">
      <div className="container mx-auto px-6 max-w-7xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Logo size={32} />
              <span className="text-xl font-bold tracking-tight">NookBook</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold mb-3 text-sm">Личный кабинет</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <button
                    onClick={() => setShowAuthDialog(true)}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Войти
                  </button>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link href="/favorites" className="hover:text-primary transition-colors">
                      Избранное
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Поддержка</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>+375 29 123-45-67</li>
              <li>
                <a href="mailto:support@nookbook.by" className="hover:text-primary transition-colors">
                  support@nookbook.by
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Гостям</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  О сервисе
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">FAQ</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="/faq/how-to-book" className="hover:text-primary transition-colors">
                  Как забронировать?
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Вопросы и ответы
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-6 pt-6 text-center text-sm text-muted-foreground">
          <p>© 2026 NookBook. Все права защищены.</p>
        </div>
      </div>
      
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </footer>
  );
};

