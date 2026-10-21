import LegalPage from './LegalPage'
import { SITE_NAME, CONTACT_EMAIL } from './siteInfo'

function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what personal information {SITE_NAME} collects, how we use it, and the
        choices you have. By using {SITE_NAME} you agree to the practices described here.
      </p>

      <h2>1. Who we are</h2>
      <p>
        {SITE_NAME} is a web platform that helps vendors, dispatch riders and customers track
        deliveries. Questions about this policy can be sent to{' '}
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>Account details: your name, phone number, email address and role (vendor or rider). Your password is handled by our secure sign-in provider, and we never see it in plain text.</li>
        <li>If you use Google sign-in: the name and email address Google shares with us.</li>
        <li>Delivery details: item name, pickup and drop-off locations, the customer's phone number, estimated delivery time, tracking code, confirmation code, delivery status and timestamps.</li>
        <li>Rider availability: whether you are marked available and when you were last active on the platform. We do not track your live GPS location.</li>
        <li>On your device: your sign-in session and your light or dark theme choice.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To run the platform: create accounts, create and track deliveries and assign riders.</li>
        <li>To show vendors which riders are available.</li>
        <li>To let customers follow a delivery using a tracking code.</li>
        <li>To prevent fraud: a delivery is completed only with the customer's confirmation code.</li>
        <li>To keep the platform secure, fix problems and improve the service.</li>
        <li>To contact you about your account or this service.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>4. Who can see what</h2>
      <ul>
        <li>Vendors can see rider names, availability, last-active time and can contact riders by WhatsApp or phone call using the rider's phone number.</li>
        <li>Riders can see the details of deliveries assigned to them.</li>
                <li>Company accounts can see the names, phone numbers, availability and delivery activity of riders who joined their fleet with the company's invite code. Riders in a company fleet are not shown to independent vendors.</li>
        <li>Anyone with a tracking code can see that delivery's item name, route and status. The customer's confirmation code is shown only once the delivery is in transit.</li>
        <li>Your name and phone number may be visible to other signed-in users so that deliveries can be coordinated.</li>
      </ul>
            <h2>4a. Ratings and public pages</h2>
      <ul>
        <li>If you rate a delivery, we store your star rating and optional comment with that delivery. The business can read the comment. The public sees only a business's average rating, and only after enough ratings.</li>
        <li>Public business pages show the business name, city and state, delivery results and, if the business chooses, a contact number.</li>
      </ul>

      <h2>4b. Location pins</h2>
      <ul>
        <li>If a customer shares their location through a delivery link, or a sender adds a pin, we store the coordinates with that delivery so the rider can find the place.</li>
        <li>A pin is visible to the sender, the assigned rider and our admin team. We do not track a customer after they share it.</li>
        <li>Sharing a location is always optional.</li>
      </ul>
      
      <h2>5. Service providers and where data is stored</h2>
      <p>
        We use Supabase to store data and manage sign-in. Our database servers are located in Ireland
        (European Union), so your information is stored outside Nigeria. If you choose Google sign-in,
        Google processes that sign-in under its own privacy policy. When you tap WhatsApp or Call, you
        leave {SITE_NAME} and those services handle your information under their own terms.
      </p>

      <h2>5a. Account reviews and admin notes</h2>
      <p>
        To keep the platform safe, our team may keep internal notes about accounts, record the reason when an
        account is restricted or suspended, and keep a log of admin actions. Reports you submit about a page
        are stored with any contact details you choose to give, and are used only to review that report.
      </p>

      <h2>6. How long we keep information</h2>
      <p>
        We keep your information while your account is active and as long as needed to run the
        service, resolve disputes and meet legal obligations. You can ask us to delete your account
        and personal information at any time.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You may ask to access, correct or delete your personal information, to object to certain
        uses, or to withdraw your consent. Email us at{' '}
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>. You also have the right to complain
        to the Nigeria Data Protection Commission.
      </p>

      <h2>8. Security</h2>
      <p>
        We use reasonable technical and organisational measures to protect your information. No
        online service is completely secure, so we cannot guarantee absolute security.
      </p>

      <h2>9. Children</h2>
      <p>{SITE_NAME} is not intended for anyone under 18, and we do not knowingly collect their information.</p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The date at the top shows when it was last
        changed. Continued use of the service after an update means you accept the new version.
      </p>

      <h2>11. Contact</h2>
      <p>
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  )
}

export default Privacy