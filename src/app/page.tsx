import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return <main className={styles.opening}>
      <header className={styles.brand}>
        <h1 aria-label="Chefs Help Chefs" className={styles.brandTitle}>
          <span>Chefs Help</span>
          <span>Chefs</span>
        </h1>
        <p className={styles.slogan}>Smarter plans. More stars.</p>
      </header>

      <section className={styles.city} aria-label="纽约入口">
        <p className={styles.welcome}>欢迎来到</p>
        <h2 className={styles.cityTitle}>纽约</h2>
        <Link href="/new-york" className={styles.enter}>点击进入 <span>→</span></Link>
      </section>

      <p className={styles.hint}>更多城市即将开放</p>
  </main>;
}
