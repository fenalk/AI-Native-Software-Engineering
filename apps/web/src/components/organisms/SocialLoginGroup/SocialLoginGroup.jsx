import { SocialButton } from '../../molecules/SocialButton/SocialButton.jsx'
import styles from './SocialLoginGroup.module.css'

const DEFAULT_PROVIDERS = [
  {
    id: 'github',
    label: 'Github',
    icon: '/Github.png',
    href: '#login-github',
  },
  {
    id: 'google',
    label: 'Gmail',
    icon: '/Google.png',
    href: '#login-google',
  },
]

export function SocialLoginGroup({ providers = DEFAULT_PROVIDERS }) {
  return (
    <ul className={styles.list}>
      {providers.map((provider) => (
        <li key={provider.id}>
          <SocialButton
            href={provider.href}
            icon={provider.icon}
            label={provider.label}
          />
        </li>
      ))}
    </ul>
  )
}
