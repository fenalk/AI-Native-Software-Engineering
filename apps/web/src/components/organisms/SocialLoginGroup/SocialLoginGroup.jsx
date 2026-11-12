import { SocialButton } from '../../molecules/SocialButton/SocialButton.jsx'

const DEFAULT_PROVIDERS = [
  {
    id: 'github',
    label: 'Github',
    icon: '/Github.png',
    iconSize: 'lg',
    href: '#social-github',
  },
  {
    id: 'google',
    label: 'Gmail',
    icon: '/Google.png',
    iconSize: 'md',
    href: '#social-google',
  },
]

export function SocialLoginGroup({ providers = DEFAULT_PROVIDERS }) {
  return (
    <ul className="m-0 flex list-none items-start justify-center gap-6 p-0">
      {providers.map((provider) => (
        <li key={provider.id}>
          <SocialButton
            href={provider.href}
            icon={provider.icon}
            iconSize={provider.iconSize}
            label={provider.label}
          />
        </li>
      ))}
    </ul>
  )
}
