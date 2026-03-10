import './auth.css';

const Contact = () => {
  return (
    <section id="contact" className="auth-page">
      <div className="auth-container">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Contact Us</h2>
        <form
          action="https://formspree.io/f/mkonenbl"
          method="POST"
          className="auth-form"
        >
          <label className="auth-label">
            Your email:
            <input type="email" name="email" className="auth-input" required />
          </label>
          <label className="auth-label">
            Your message:
            <textarea
              name="message"
              className="auth-input"
              rows={4}
              required
            ></textarea>
          </label>
          <button type="submit" className="btn auth-submit">
            Send
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;

