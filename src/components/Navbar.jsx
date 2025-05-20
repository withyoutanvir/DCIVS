import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from "@nextui-org/react";
import { ConnectWallet } from "@thirdweb-dev/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTheme } from "next-themes";

// Theme configurations
const themes = {
  dark: {
    colors: {
      modalBg: "#ffffff",
      dropdownBg: "#ffffff",
      primaryText: "#000000",
      connectedButtonBg: "#ffffff",
      secondaryButtonText: "#0a0a0a",
      borderColor: "#050505",
      primaryButtonBg: "#ffffff",
      primaryButtonText: "#000000",
      accentText: "#005ce6",
      accentButtonBg: "#005ce6",
      separatorLine: "#1a191a",
      danger: "#e84f30",
      success: "#31a56d",
      secondaryText: "#676670",
      accentButtonText: "#000000",
      secondaryButtonBg: "#fafafa",
      secondaryButtonHoverBg: "#000000",
      connectedButtonBgHover: "#000000",
      walletSelectorButtonHoverBg: "#f5f4f5",
      skeletonBg: "#e8e7e9",
      selectedTextColor: "#f9f5f9",
      secondaryIconHoverBg: "#e5e6eb",
    },
  },
  light: {
    colors: {
      modalBg: "#131418",
      dropdownBg: "#131418",
      primaryText: "#ffffff",
      connectedButtonBg: "#131418",
      secondaryButtonText: "#fdf7f7",
      borderColor: "#e6e5e6",
      primaryButtonBg: "#050505",
      primaryButtonText: "#ffffff",
      accentText: "#005ce6",
      accentButtonBg: "#005ce6",
      separatorLine: "#e9e7e9",
      danger: "#e84f30",
      success: "#31a56d",
      secondaryText: "#6f6e77",
      accentButtonText: "#fdfcfd",
      secondaryButtonBg: "#ebeaeb",
      secondaryButtonHoverBg: "#e1e0e1",
      connectedButtonBgHover: "#f8f6f8",
      walletSelectorButtonHoverBg: "#f5f4f5",
      skeletonBg: "#e8e7e9",
      selectedTextColor: "#f9f5f9",
    },
  },
};

export default function Navbar2({ address, setIdentity, register, checkMetmask }) {
  const { theme } = useTheme();
  const [activeLink, setActiveLink] = useState(null);

  // Memoized theme selection
  const walletTheme = useMemo(() => (theme === "dark" ? themes.dark : themes.light), [theme]);

  // Handlers using useCallback to prevent unnecessary re-renders
  const handleRegisterClick = useCallback(() => {
    setIdentity(true);
    setActiveLink("register");
  }, [setIdentity]);

  const handleLinkClick = useCallback((linkName) => {
    setActiveLink(linkName);
  }, []);

  // Reset active link when a wallet is connected
  useEffect(() => {
    if (address) setActiveLink(null);
  }, [address]);

  // Navigation links configuration
  const navLinks = [
    { name: "Menu", href: "/menu" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Requests", href: "/approved-data" },
  ];

  return (
    <Navbar isBordered position="sticky" maxWidth="full">
      {/* Brand Logo */}
      <NavbarBrand>
        <Link
          onClick={() => handleLinkClick("homepage")}
          color="foreground"
          style={{ fontWeight: "bold", fontSize: "1.5rem" }}
          href="/"
        >
          DIVS
        </Link>
      </NavbarBrand>

      {/* Centered Navigation Links (only if connected) */}
      {address && (
        <NavbarContent justify="center">
          {navLinks.map(({ name, href }) => (
            <NavbarItem key={name} isActive={activeLink === name.toLowerCase()}>
              <Link
                color={activeLink === name.toLowerCase() ? "primary" : "foreground"}
                onClick={() => handleLinkClick(name.toLowerCase())}
                href={href}
              >
                {name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      )}

      {/* Right-side Buttons */}
      <NavbarContent justify="end">
        {register && checkMetmask && (
          <NavbarItem isActive={activeLink === "register"}>
            <Link color={activeLink === "register" ? "primary" : "foreground"} onClick={handleRegisterClick} href="/register">
              Register
            </Link>
          </NavbarItem>
        )}
        <NavbarItem>
          {checkMetmask && (
            <ConnectWallet
              theme={walletTheme}
              btnTitle="Connect Wallet"
              modalTitle="D.I.V.S"
              modalSize="wide"
              modalTitleIconUrl="/logo.png"
              welcomeScreen={{
                img: { src: "/welcome.png", width: 400, height: 400 },
                title: "YOUR GATEWAY TO DECENTRALIZED IDENTITY",
              }}
            />
          )}
        </NavbarItem>
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
