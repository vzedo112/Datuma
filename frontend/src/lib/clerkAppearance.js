export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    showOptionalFields: false,
    helpPageUrl: "",
    privacyPageUrl: "",
    termsPageUrl: "",
  },
  variables: {
    colorPrimary: "#14110d",
    colorBackground: "transparent",
    colorText: "#14110d",
    colorTextSecondary: "#6b6457",
    colorInputBackground: "#ffffff",
    colorInputText: "#14110d",
    colorDanger: "#b8533d",
    colorSuccess: "#4f7d3d",
    borderRadius: "0.5rem",
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    fontFamilyButtons: '"Instrument Sans", system-ui, sans-serif',
    fontSize: "14px",
    spacingUnit: "1rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "!bg-transparent !shadow-none !border-none !rounded-none w-full max-w-md mx-auto",
    card:
      "!bg-transparent !shadow-none !border-none !rounded-none !p-0 w-full",
    header: "hidden",
    main: "gap-4",

    // Social buttons (Google, GitHub, etc.)
    socialButtons: "!flex !flex-col !gap-2 !w-full",
    socialButtonsBlockButton:
      "!border !border-foreground/15 !bg-card hover:!bg-accent !rounded-full !h-11 !normal-case !text-foreground !w-full transition-colors",
    socialButtonsBlockButtonText: "!font-medium !text-sm",
    socialButtonsProviderIcon: "!h-4 !w-4",

    // Divider between social and email
    dividerRow: "!my-6",
    dividerLine: "!bg-border",
    dividerText:
      "!text-muted-foreground !text-[10px] !uppercase !tracking-widest !font-mono !px-3",

    // Form fields
    formFieldRow: "!mb-3",
    formFieldLabel:
      "!text-muted-foreground !text-[10px] !font-mono !uppercase !tracking-widest !mb-2",
    formFieldLabelRow: "!mb-2",
    formFieldInput:
      "!bg-card !border-foreground/15 focus:!border-foreground focus:!ring-0 !rounded-md !h-12 !px-4 !text-sm !text-foreground",
    formFieldInputShowPasswordButton:
      "!text-muted-foreground hover:!text-foreground",
    formFieldAction:
      "!text-xs !text-brand hover:!text-brand-hover !underline !underline-offset-4",

    // Primary button (Continue / Sign in)
    formButtonPrimary:
      "!bg-foreground hover:!bg-foreground/90 !text-background !normal-case !font-medium !rounded-full !h-11 !tracking-normal !text-sm !shadow-none transition-all !py-0",
    formButtonReset:
      "!text-muted-foreground hover:!text-foreground !text-sm",

    // OTP / verification input
    otpCodeFieldInput:
      "!bg-card !border-foreground/15 focus:!border-foreground !rounded-md",
    formResendCodeLink: "!text-brand hover:!text-brand-hover",

    // Footer hidden — we render our own action link below the form
    // so the dev-mode badge / "Secured by Clerk" container doesn't show as a dark box.
    footer: "!hidden",
    footerAction: "!hidden",
    footerActionText: "!hidden",
    footerActionLink: "!hidden",
    footerPages: "!hidden",
    footerPagesLink: "!hidden",

    // Identity preview (verification step)
    identityPreview: "!bg-card !border-foreground/15 !rounded-md",
    identityPreviewText: "!text-foreground",
    identityPreviewEditButton: "!text-muted-foreground hover:!text-foreground",
    identityPreviewEditButtonIcon: "!text-muted-foreground",

    // Alerts
    alert: "!rounded-md",
    alertText: "!text-sm",

    // User button (avatar dropdown in TopNav)
    userButtonAvatarBox: "h-8 w-8",
    userButtonPopoverCard:
      "!bg-card !border !border-border !shadow-md !rounded-lg",
    userButtonPopoverActionButton: "hover:!bg-accent !rounded-md",
    userButtonPopoverActionButtonText: "!text-foreground !text-sm",
    userButtonPopoverFooter: "!border-t !border-border",
    userPreviewMainIdentifier: "!text-foreground",
    userPreviewSecondaryIdentifier: "!text-muted-foreground",
  },
};
