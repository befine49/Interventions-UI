import { Link } from "react-router-dom";
import hero from './Hero.module.css';

function Hero() {
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
            <a className="nav-link" href="#">
              <p className={hero.icon}>
                <span className="material-symbols-outlined">notifications_active</span>
              </p>
              <p className={hero.des}>Notification</p>
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
