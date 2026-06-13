import { useEffect } from 'react'
import '../styles/globals.css'
import '../styles/theme.css'
import '../styles/global.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider, useTheme } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { useRouter } from 'next/router'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import PlausibleProvider from 'next-plausible'

import { css, lightTheme as stitchesLightTheme, darkTheme as stitchesDarkTheme } from '../stitches.config'
import { lightTheme as vanillaLightTheme, darkTheme as vanillaDarkTheme } from '../styles/theme.css'
import Navigation from '../components/Navigation'
import { fetchFiles } from '../state/actions'
import state from '../state'

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import { useSnapshot } from 'valtio'
import Alert from '../components/AlertDialog'
import { Button, Flex } from '../components'
import { ChatCircleText } from 'phosphor-react'

TimeAgo.setDefaultLocale(en.locale)
TimeAgo.addLocale(en)

// Component to sync Stitches theme with next-themes
function StitchesThemeSync() {
  const { theme } = useTheme()

  useEffect(() => {
    const html = document.documentElement
    // Remove both theme classes first
    html.classList.remove(stitchesLightTheme, stitchesDarkTheme)
    // Add the appropriate theme class
    if (theme === 'light') {
      html.classList.add(stitchesLightTheme)
    } else {
      html.classList.add(stitchesDarkTheme)
    }
  }, [theme])

  return null
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter()
  const slug = router.query?.slug
  const gistId = (Array.isArray(slug) && slug[0]) ?? null

  const origin = 'https://xrpl-hooks-ide.vercel.app' // TODO: Change when site is deployed
  const shareImg = '/share-image.png'

  const snap = useSnapshot(state)
  useEffect(() => {
    if (gistId && router.isReady) {
      fetchFiles(gistId)
    } else {
      if (
        !gistId &&
        router.isReady &&
        router.pathname.includes('/develop') &&
        !snap.files.length &&
        !snap.mainModalShowed
      ) {
        state.mainModalOpen = true
        state.mainModalShowed = true
      }
    }
  }, [gistId, router.isReady, router.pathname, snap.files, snap.mainModalShowed])

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="format-detection" content="telephone=no" />
        <meta property="og:url" content={`${origin}${router.asPath}`} />

        <title>Xahau Hooks Builder</title>
        <meta property="og:title" content="Xahau Hooks Builder" />
        <meta name="twitter:title" content="Xahau Hooks Builder" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@XRPLF" />
        <meta
          name="description"
          content="Hooks Builder, add smart contract functionality to the Xahau Network."
        />
        <meta
          property="og:description"
          content="Hooks Builder, add smart contract functionality to the Xahau Network."
        />
        <meta
          name="twitter:description"
          content="Hooks Builder, add smart contract functionality to the Xahau Network."
        />
        <meta property="og:image" content={`${origin}${shareImg}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content={`${origin}${shareImg}`} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#161618" />
        <meta name="application-name" content="XRPL Hooks Builder" />
        <meta name="msapplication-TileColor" content="#c10ad0" />
        <meta name="theme-color" content="#161618" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FDFCFD" media="(prefers-color-scheme: light)" />
      </Head>

      <TooltipPrimitive.Provider delayDuration={100}>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            value={{
              light: vanillaLightTheme,
              dark: vanillaDarkTheme,
            }}
          >
            <StitchesThemeSync />
            <PlausibleProvider domain="hooks-builder.xrpl.org" trackOutboundLinks>
              <Navigation />
              <Component {...pageProps} />
              <Toaster
                toastOptions={{
                  className: css({
                    backgroundColor: '$mauve1',
                    color: '$mauve10',
                    fontSize: '$sm',
                    zIndex: 9999,
                    '.dark &': {
                      backgroundColor: '$mauve4',
                      color: '$mauve12'
                    }
                  })()
                }}
              />
              <Alert />
              <Flex
                as="a"
                href="https://github.com/Xahau/xrpl-hooks-ide/issues"
                target="_blank"
                rel="noopener noreferrer"
                css={{ position: 'fixed', right: '$4', bottom: '$4' }}
              >
                <Button size="sm" variant="primary" outline>
                  <ChatCircleText size={14} style={{ marginRight: '0px' }} />
                  Bugs & Discussions
                </Button>
              </Flex>
            </PlausibleProvider>
          </ThemeProvider>
        </SessionProvider>
      </TooltipPrimitive.Provider>
    </>
  )
}
export default MyApp
