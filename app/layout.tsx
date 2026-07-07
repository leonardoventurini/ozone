'use client' // @TODO Totally circumventing SSC
import '../styles/globals.css'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'

import { Shell } from '@/shell/Shell'
import { CommandPaletteRoot } from '@/shell/CommandPalette/Root'
import { AuthProvider } from '@/shell/AuthContext'
import { DefaultQueryClientProvider } from '@/shell/QueryClient'
import { GlobalQueryClientProvider } from '@/shell/QueryClient'
import { applyColorSchemePreference } from '@/common/useColorScheme'
import { HANDLE_RESOLVER_URL, PLC_DIRECTORY_URL } from '@/lib/constants'
import { ConfigProvider } from '@/shell/ConfigContext'
import { ConfigurationProvider } from '@/shell/ConfigurationContext'
import { ExternalLabelersProvider } from '@/shell/ExternalLabelersContext'

const DEFAULT_FAVICON_HREF = '/img/logo-colorful.png'
const LOCALHOST_FAVICON_HREF = '/img/logo-white.png'

const isLocalhost = (): boolean => {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1'
  )
}

/** Root application shell with browser-only preferences applied after hydration. */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    applyColorSchemePreference()

    if (isLocalhost()) {
      document
        .querySelector<HTMLLinkElement>('link[rel="icon"]')
        ?.setAttribute('href', LOCALHOST_FAVICON_HREF)
    }
  }, [])

  return (
    <html lang="en" className="h-full bg-gray-50 dark:bg-slate-900">
      <title>Ozone</title>
      <link rel="icon" href={DEFAULT_FAVICON_HREF} sizes="any" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <body className="h-full overflow-hidden">
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          closeOnClick
        />

        <GlobalQueryClientProvider>
          <ConfigProvider>
            <AuthProvider
              plcDirectoryUrl={PLC_DIRECTORY_URL}
              handleResolver={HANDLE_RESOLVER_URL}
            >
              <DefaultQueryClientProvider>
                <ConfigurationProvider>
                  <ExternalLabelersProvider>
                    <CommandPaletteRoot>
                      <Shell>{children}</Shell>
                    </CommandPaletteRoot>
                  </ExternalLabelersProvider>
                </ConfigurationProvider>
              </DefaultQueryClientProvider>
            </AuthProvider>
          </ConfigProvider>
        </GlobalQueryClientProvider>
      </body>
    </html>
  )
}
