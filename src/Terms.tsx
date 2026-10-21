import LegalPage from './LegalPage'
import { SITE_NAME, CONTACT_EMAIL } from './siteInfo'

function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern your use of {SITE_NAME}. By creating an account or using the service you
        agree to them. If you do not agree, please do not use the service.
      </p>

      <h2>1. What {SITE_NAME} is</h2>
      <p>
        {SITE_NAME} is a software tool that lets vendors create deliveries, riders update their
        progress and customers track them. We are not a courier or logistics company, and we are not
        a party to any delivery arrangement between vendors, riders and customers.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>You must give accurate information and keep it up to date.</li>
        <li>You are responsible for keeping your login details safe and for activity on your account.</li>
      </ul>

      <h2>3. Vendors</h2>
      <ul>
        <li>You are responsible for the accuracy of the delivery details you enter.</li>
        <li>You must not send items that are illegal or prohibited.</li>
        <li>You must only use customers' phone numbers to coordinate their delivery.</li>
        <li>Any agreement about delivery fees or payment is between you, the rider and the customer.</li>
      </ul>

      <h2>4. Riders</h2>
      <ul>
        <li>Riders act independently and are not employees or agents of {SITE_NAME}.</li>
        <li>Keep your availability status honest and update delivery status truthfully.</li>
        <li>Never mark a delivery as delivered without receiving the customer's confirmation code.</li>
      </ul>
          <h2>4a. Dispatch companies</h2>
      <ul>
        <li>A company is responsible for the riders in its fleet and for how they use the platform.</li>
        <li>Only invite riders who have agreed to join your fleet, and remove riders who leave.</li>
        <li>You may only use rider and customer information to run your deliveries.</li>
        <li>A "Verified" badge means we checked the company's registration details. It is not a guarantee of service quality.</li>
      </ul>
      <h2>5. The confirmation code</h2>
      <p>
        Customers should share their confirmation code only when they have received their item.
        Misusing or guessing codes, or completing a delivery without a valid code, may lead to
        suspension of your account.
      </p>

      <h2>5a. Verification, ratings and public pages</h2>
      <ul>
        <li>A blue tick means we checked a business's registration or identity. It does not guarantee the quality of its service or products, and we can remove it at any time.</li>
        <li>A tick may be earned through a business's track record or offered with a paid Verified plan. A paid plan never skips our checks.</li>
        <li>"Top rated" is earned from a business's results and cannot be bought.</li>
        <li>Customers can rate a delivery once it is confirmed with their code. A rating reflects the delivery experience, not the quality of the product. Ratings must be honest, and we may remove ratings that are abusive, fake or unrelated to the delivery.</li>
        <li>A business's public page shows its name, location, results and, if the business chooses, a contact number.</li>
      </ul>
      <h2>5b. Location sharing</h2>
      <ul>
        <li>Sharing a location pin is voluntary. Only share it through links sent by the sender of your delivery.</li>
        <li>Senders and riders may use a pin only to complete that delivery, and must not store or share it afterwards.</li>
        <li>A pin may be inaccurate, so riders may still contact the customer to confirm the address.</li>
      </ul>
      
      <h2>6. Acceptable use</h2>
      <ul>
        <li>Do not use the service for anything unlawful, fraudulent or abusive.</li>
        <li>Do not harass other users or misuse their contact details.</li>
        <li>Do not attempt to access other users' data, disrupt the platform or scrape its content.</li>
      </ul>

      <h2>7. Fees</h2>
      <p>
        The service is currently free to use. We may introduce paid plans or fees in future, and we
        will give notice before any charge applies to you.
      </p>

      <h2>8. No guarantees</h2>
      <p>
        The service is provided as it is. We do not guarantee that it will always be available or
        error-free. We do not verify the identity, conduct or reliability of vendors, riders or
        customers, so please use your own judgement when dealing with other users.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law, {SITE_NAME} is not responsible for lost, damaged or
        delayed items, disputes between users, or indirect or consequential losses arising from your
        use of the service.
      </p>

      <h2>10. Suspension and ending your account</h2>
      <p>
        We may suspend or close accounts that break these terms or put other users at risk. You can
        stop using the service and ask us to delete your account at any time.
      </p>


      <h2>10a. Restrictions and appeals</h2>
      <ul>
        <li>We may restrict or suspend an account that breaks these terms, puts others at risk, or is under review. We will show you the reason when we do.</li>
        <li>A restricted account can finish current deliveries but may not be able to create new ones, go available, or appear on public pages. A suspended account cannot be used.</li>
        <li>You can appeal by contacting us at the email shown in the app. We review appeals and may reinstate an account.</li>
        <li>Company accounts are reviewed before they can create deliveries or invite riders.</li>
      </ul>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continued use
        after an update means you accept it.
      </p>

      <h2>12. Governing law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

      <h2>13. Contact</h2>
      <p>
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  )
}

export default Terms