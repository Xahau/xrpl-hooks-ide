import NextAuth from 'next-auth'

declare module "next-auth" {
  interface User {
    username: string
  }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    //   // @ts-expect-error
    //   scope: 'user,gist'
    // }),
    {
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: 'https://github.com/login/oauth/authorize?scope=read:user+user:email+gist',
      token: 'https://github.com/login/oauth/access_token',
      userinfo: 'https://api.github.com/user',
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          username: profile.login,
          email: profile.email,
          image: profile.avatar_url
        }
      }
    }
    // ...add more providers here
  ],
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      if (account && account.access_token) {
        token.accessToken = account.access_token
        token.username = user?.username || ''
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session['user']['username'] = token.username as string
      return session
    }
  }
})
