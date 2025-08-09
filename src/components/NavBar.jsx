import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from "../assets/logo.png";
import Styles from './NavBar.module.css';
import { useNotifications } from "../notifications/NotificationProvider";

const Navbar = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markInterventionRead, markAllRead } = useNotifications();

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")));
  }, [location]);

  return (
    <header className='container'>
      <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <a class="navbar-brand" href="#"><span ><img src={logo} alt="" className={Styles}/></span>Intervention</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">  
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#">Accueill</a>
              </li>
              {(user?.is_staff) &&
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Services
                  </a>
                  <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#">Créer une demande</a></li>
                    <li><a class="dropdown-item" href="#">Mes demandes</a></li>
                    <li><a class="dropdown-item" href="#">Historique</a></li>
                  </ul>
                </li>
              }
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Profile
                </a>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="#">Action</a></li>
                  <li><a class="dropdown-item" href="#">Another action</a></li>
                  <li><a class="dropdown-item" href="#">Something else here</a></li>
                </ul>
              </li>
            </ul>
            <div class="d-flex align-items-center gap-3">
              {/* Notifications bell */}
              <div class="nav-item dropdown">
                <a class="nav-link position-relative" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Notifications">
                  <span class="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" style={{ minWidth: '320px' }}>
                  <li class="dropdown-header d-flex justify-content-between align-items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button class="btn btn-link btn-sm" onClick={(e) => { e.preventDefault(); markAllRead(); }}>Mark all as read</button>
                    )}
                  </li>
                  {notifications.length === 0 ? (
                    <li class="dropdown-item text-muted">No new notifications</li>
                  ) : (
                    notifications.map(n => (
                      <li key={`${n.interventionId}-${n.timestamp}`} class="dropdown-item" style={{ whiteSpace: 'normal' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); markInterventionRead(n.interventionId); navigate(`/intervention/${n.interventionId}/chat`); }}>
                          <div class="fw-bold">{n.title} • From {n.fromUser}</div>
                          <div class="text-muted" style={{ fontSize: '12px' }}>{n.message}</div>
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            {user ? (
              <Link className="btn btn-outline-danger mx-2" to="/logout">Logout</Link>
            ) : (
              <>
                <Link className="btn btn-primary mx-2" to="/login">Login</Link>
                <Link className="btn btn-outline-primary mx-2" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;