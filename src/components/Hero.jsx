import { Link } from "react-router-dom";
import hero from './Hero.module.css';
import logo from "../assets/logo.png";

function Hero() {
  const handleNotificationClick = async (e) => {
    e.preventDefault();
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        alert('Browser notifications are not supported in this environment.');
        return;
      }
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission().catch(() => 'denied');
      }
      if (permission !== 'granted') {
        alert('Please enable notifications for this site in your browser settings.');
        return;
      }
      const n = new Notification('Notifications enabled', {
        body: 'You will receive alerts even when this tab is not focused.',
        icon: logo,
        badge: logo,
      });
      n.onclick = () => window.focus();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([100]); } catch (_) { /* noop */ }
      }
    } catch (_) {
      // ignore
    }
  };
  return (
    <main className="container">
      <header className={hero.hero}>
        <ul className="nav nav-pills nav-fill">
          <li className="nav-item">
            <Link className="nav-link" to="/interventions">
              <p className={hero.icon}>
                <span className="material-symbols-outlined">chat</span>
              </p>
              <p className={hero.des}>Support Requests</p>
            </Link>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              <p className={hero.icon}>
                <span className="material-symbols-outlined">call</span>
              </p>
              <p className={hero.des}>Call</p>
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#" onClick={handleNotificationClick}>
              <p className={hero.icon}>
                <span className="material-symbols-outlined">notifications_active</span>
              </p>
              <p className={hero.des}>Enable Notifications</p>
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              <p className={hero.icon}>
                <span className="material-symbols-outlined">support_agent</span>
              </p>
              <p className={hero.des}>Support</p>
            </a>
          </li>
        </ul>
      </header>
    </main>
  );
}

export default Hero;
