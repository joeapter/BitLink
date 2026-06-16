import type { Metadata } from "next";
import Image from "next/image";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Terms & Conditions | BitLink",
  description: "BitLink Terms and Conditions for telecommunication services.",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-8 border-b-2 border-slate-300 pb-1 text-base font-bold uppercase tracking-wide text-slate-700">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 leading-7 text-slate-700">{children}</p>;
}

function Clause({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex gap-4 leading-7 text-slate-700">
      <span className="shrink-0 font-semibold text-slate-500">{n}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 2cm; size: A4; }
        }
      `}</style>

      <div className="no-print fixed right-6 top-6 z-50">
        <PrintButton />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 text-sm">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
          <Image src="/assets/logo-v2.png" alt="BitLink" width={130} height={39} className="h-9 w-auto" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-slate-800">Terms and Conditions for Telecommunication Services</h1>
          <div className="mt-4 text-slate-600 leading-7">
            <p className="font-semibold">BitLink Ltd. — 341280188</p>
            <p>HaRashar Hirsch 4/1 — Israel</p>
            <p>
              Phone / WhatsApp: +972-58-793-9426 · Email:{" "}
              <a href="mailto:support@bitlink.co.il" className="text-link-blue">support@bitlink.co.il</a>
            </p>
            <p>Website: <a href="https://www.bitlink.co.il" className="text-link-blue">www.bitlink.co.il</a></p>
            <p className="mt-1 text-slate-500">Sunday – Thursday: 9:00 am – 6:00 pm · Friday: 9:00 am – 12:00 pm</p>
          </div>
        </div>

        {/* 1. Introduction */}
        <H2>1. Introduction</H2>
        <Clause n="1.1">The company will assign the subscriber a telephone number from its number database. The company is not required to assign the subscriber a particular telephone number. The company is entitled to change the telephone number assigned to the subscriber for technical and regulatory reasons. The company does not undertake to keep a number assigned to a subscriber in the past if the subscriber has waived it, if the service contract has expired, or if it has been canceled.</Clause>
        <Clause n="1.2">The SIM card is intended for use in authorized devices only, for use on the company's network. For SIM cards to be used with specific device types (such as mobile phones, smartphones, kosher phones, or cellular modems), they are allowed to be used in devices of the same type only. The SIM card must not be installed in a cellular modem or in a mobile connected to a cellular modem, even temporarily, unless the company has authorized the subscriber to do so explicitly.</Clause>
        <Clause n="1.3">In the case of number porting — the billing will begin at the end of the porting process, or the first usage of the line, whichever comes first. In the case of allocation of a phone number without porting, the subscriber will be billed for all services as soon as the transaction is set up.</Clause>
        <Clause n="1.4">If within 90 days of the transaction as part of a number porting, the porting process is not completed or a first use of the telephone number assigned to the carrier has not been completed by the subscriber, the transaction will be canceled and the mobile number assigned to the subscriber will be disconnected and it will no longer be usable.</Clause>
        <Clause n="1.5">This document along with the terms of the selected offer and additional documents, all together form the service agreement between the Subscriber and the Company.</Clause>

        {/* 2. General */}
        <H2>2. General</H2>
        <Clause n="2.1">Usage of services is subject to payment unless otherwise specified. The rates detailed in the plan chosen by the subscriber and the general rates as set by the company are available on the company's website.</Clause>
        <Clause n="2.2">The company is entitled to set the rates, fees, and additional services (paid or free), even if they were not included in the service contract at the time of signing. If the subscriber uses them, they will be charged according to the rates set at the time of use.</Clause>
        <Clause n="2.3">The usage of the company's network is subject to the rules, legal conditions, and service contract. This document includes the general conditions of the contract. Rates and special subscription prices are detailed in the subscriber's specific subscription. Other rates are detailed in the company's general rates list and can be consulted on the company's website.</Clause>
        <Clause n="2.4">The General Director of the Department of Communications or any person appointed by him is authorized to order the company to modify the service contracts. The subscriber's contract with the company under this service agreement constitutes the subscriber's consent for such modification as stipulated.</Clause>
        <Clause n="2.5">Any change in the conditions of the contract will be made according to the conditions of the license and in accordance with the law.</Clause>
        <Clause n="2.6">The responsibility to cancel services rests with the subscriber. If the service operates using a dedicated application, stopping the service or deleting the application from the phone does not interrupt the service. The subscriber must email <a href="mailto:support@bitlink.co.il" className="text-link-blue">support@bitlink.co.il</a> and ask for the service to be stopped.</Clause>

        {/* 3. Services */}
        <H2>3. Services and Their Usage</H2>
        <Clause n="3.1">Once the subscriber is connected to the company's network, and subject to payment for the services, the company undertakes to provide the subscriber with the communication services in accordance with and subject to the terms of the contract, the license, and the law.</Clause>
        <Clause n="3.2">The company has the operator license for the provision of communication services using a partner network and the services of that partner network. The entire and exclusive responsibility for all communication services provided to the subscriber under this contract is the responsibility of the company and is subject to the terms of this contract. A subscriber will in no way contact the partner network directly, but only the company.</Clause>
        <Clause n="3.3">The termination or limitation of the services of the company will be carried out by the company in accordance with the conditions of the license and the legal conditions only.</Clause>
        <Clause n="3.4">The company is entitled to add or cancel services regularly and to modify the rules of use concerning them, and the rates, in accordance with the license and according to the instructions of the Ministry of Communications. The company will inform the subscriber of any change in existing services in advance and in sufficient time.</Clause>
        <Clause n="3.5">The subscriber will have to pay for services despite network limitations, coverage issues, and device limitations, even if there has been interference.</Clause>
        <Clause n="3.6">The subscriber is entitled to switch between plans, packages, surfing capacity, and other offers that are available at the time of the request, and not more than once per calendar month. A change from one rate offer to another can only be made at the beginning of the billing cycle. The change in plan may be subject to an additional fee as detailed in the general rate table.</Clause>
        <Clause n="3.7">A subscriber will not be entitled to combined benefits or discounts unless explicitly granted by the company. The company is entitled to revoke such benefits at its discretion.</Clause>
        <Clause n="3.8">Blocking of services for the first time is without an added fee. The company is entitled to charge for additional changes.</Clause>

        {/* 4. Conditions */}
        <H2>4. Conditions of the Supplying of Telecommunication Services</H2>
        <Clause n="4.1">The telecommunication services will be provided to the subscriber in the coverage area of the partner network.</Clause>
        <Clause n="4.2">The company is not obligated to full and complete coverage and emphasizes that not all services may be available on every given device or location or in the case of disconnection. However, the company agrees that the communication services provided shall not be less than the following minimum requirements: (a) the number of blocked calls during peak hours shall not exceed 2%, and (b) the number of dropped calls during peak hours shall not exceed 2%. The system shall meet the requirements detailed above at 99% during peak times. For Kosher mobile plans, the subscriber must take into account, in addition to these general terms and conditions, the specific terms outlined in Annex 1.</Clause>
        <Clause n="4.3">The services may not be used for unlawful purposes or in disturbance of others.</Clause>
        <Clause n="4.4">The subscriber is entitled to change the international service operator that was chosen by default. Any modification as such will be entitled to a fee. The subscriber has the responsibility to inform the international operator of any change of information concerning them or of their status within the network of the company.</Clause>
        <Clause n="4.5">A subscriber is entitled to block outgoing and/or incoming SMS messages. In the case of blocking incoming SMS, the subscriber can ask the company to continue to receive service SMS, such as alerts on the usage of the surfing package and messages from the operator while roaming.</Clause>
        <Clause n="4.6">The user is informed that there are attempts at fraud via SMS, phone calls, or other communication methods. Therefore, they must remain vigilant regarding messages or requests from unknown sources. These communications may seek to obtain personal or confidential information by impersonating legitimate entities. It is essential never to disclose sensitive information (access codes, passwords, credit card numbers, etc.), not to click on suspicious links, and to be particularly cautious with unusual requests. The company disclaims any responsibility for fraud or theft of personal information resulting from such attempts.</Clause>
        <Clause n="4.7">Some third-party applications or services may automatically generate SMS messages or prompt users to respond to messages from foreign destinations. These practices may result in significant charges. The company disclaims any responsibility for these costs, which are the sole responsibility of the subscriber.</Clause>

        {/* 5. Internet Browsing */}
        <H2>5. Internet Browsing</H2>
        <Clause n="5.1">In exchange for the payment of the package, the subscriber will be entitled to enjoy surfing up to the maximum volume authorized by the offer they have chosen. In the case of consumption of the authorized volume in the particular cycle, the company shall be entitled to block the surfing at its choice. There will be no added fee for use exceeding the chosen volume for which the block has been applied.</Clause>
        <Clause n="5.2">The subscriber will not be able to transfer an unused balance from one month to the next and will not be able to receive credit for it.</Clause>
        <Clause n="5.3">The speed of surfing is not fixed and depends on various factors such as the coverage of the partner network, its availability, the ability to load, types of devices, etc.</Clause>
        <Clause n="5.4">The package includes a surfing volume. In order to track the consumption of the surfing, as well as additional surfing packages, the subscriber can connect their account on the company website. It is not possible to use more than one mobile browsing package at the same time.</Clause>
        <Clause n="5.5">Mobile browsing speed is not fixed and depends on various factors such as network coverage and availability, linking technology, designated equipment, network load, cellular network, internet, and other communication networks.</Clause>
        <Clause n="5.6">High-speed surfing may result in increased data consumption in some applications. The company reserves the right to manage network load by throttling speeds when required to prevent damage to the network or its users.</Clause>
        <Clause n="5.7">The company's security measures are intended to protect the network and are not a substitute for security measures resulting from connection to external communication networks. The subscriber is responsible for the use of appropriate security measures.</Clause>
        <Clause n="5.8">In order to facilitate the control of the use of the data on the device, the company will send to the subscriber's device an SMS message once it has reached 75% of the mobile data package, as well as an additional SMS message approaching the use of 95%. Warning messages regarding the end or use of packages are estimates only and are not necessarily accurate.</Clause>
        <Clause n="5.9">The notice will be sent as soon as possible after verification. Failure to send or receive the notice, for whatever reason, will not establish a cause of action, and the subscriber remains liable for payment for full usage according to applicable rates.</Clause>
        <Clause n="5.10">Tethering — Enabling a personal access point on the device and sharing the subscriber's internet connection is the sole responsibility of the subscriber.</Clause>
        <Clause n="5.11">In the calculation of data, units are charged in relation to volume rather than time and are rounded up to whole units.</Clause>

        {/* 6. Dangers */}
        <H2>6. Dangers of Browsing the Internet</H2>
        <P>The following section is included in accordance with Israeli telecommunications regulations and is provided for the subscriber's awareness.</P>
        <Clause n="6.1">The internet provides access to knowledge, information, shopping, games, and social networks. It also opens possibilities for distributing offensive, inappropriate, or illegal content.</Clause>
        <Clause n="6.2">Among the main dangers of surfing the internet: (a) Exposure to offensive content such as pornographic, violent, or gambling content. (b) Contact with people of malicious intent using false identities. (c) Participation in blogs or forums encouraging negative phenomena. (d) Disclosure of personal information or means of payment to undesirable persons. (e) Addiction to internet browsing or specific content.</Clause>
        <Clause n="6.3">It is possible to use technological means to filter sites with inappropriate content. Please note that no filter is absolute and does not eliminate the need for other precautionary measures.</Clause>
        <Clause n="6.4">Technological means are not a replacement for education and understanding of minors. Minors should be informed about the dangers and the importance of being alert to exposure to harmful content.</Clause>
        <Clause n="6.5">Avoid giving identifying information on the internet, and it is highly recommended not to upload pictures or other personal content.</Clause>
        <Clause n="6.6">It is impossible to know and control where content shared on the internet will appear or be made available.</Clause>
        <Clause n="6.7">It is recommended to be vigilant with regard to the parties involved in the network and to encourage minors to be in contact only with people they know personally.</Clause>
        <Clause n="6.8">Parents are encouraged to increase their awareness of internet content and dangers. Additional information, including tips for safer internet browsing, is available on the company's website.</Clause>

        {/* 7. Content Services */}
        <H2>7. Content Services</H2>
        <Clause n="7.1">Content services are provided by various suppliers and are their sole responsibility. The company does not control the sources of information and is not responsible for their content, opinions, reliability, or accuracy.</Clause>
        <Clause n="7.2">A link on or from a specific site does not constitute support or endorsement by the company of that site.</Clause>
        <Clause n="7.3">In order to verify the conditions and prices applied to third-party content, the subscriber must contact the relevant suppliers. The company's access rate may be charged in addition to the supplier's rate.</Clause>
        <Clause n="7.4">The company shall not be liable for any loss, damage, or destruction, direct or indirect, caused as a result of reliance placed on content services.</Clause>

        {/* 8. Roaming */}
        <H2>8. Roaming Services</H2>
        <Clause n="8.1">Services abroad/roaming services depend on: (1) rules and coverage of overseas communication network operators who have signed a contract to provide services to the subscribers of the company; (2) the purchase of roaming services from the company prior to travel; and/or (3) bringing a compatible device for the destination.</Clause>
        <Clause n="8.2">Not all services accessible in Israel are available while roaming. Up-to-date information on coverage areas abroad, accessible services and devices, rates, and other conditions is available from customer service.</Clause>
        <Clause n="8.3">When using roaming services, the rates charged to all communication services are different from the rates charged for these same services in Israel. While roaming, an incoming call may be charged a fee.</Clause>
        <Clause n="8.4">Units of measurement while roaming may differ from those in Israel, and other conditions may apply. Roaming services will be charged in addition to the fixed payments applied according to the subscriber's tariff plan.</Clause>
        <Clause n="8.5">The subscriber is responsible for regularly checking their usage and ensuring that their plan, as well as any subscribed top-ups, cover their roaming needs. Regarding mobile browsing, usage will be blocked once the limits are reached. For calls and SMS, additional fees will apply beyond the limits of the plan or top-ups.</Clause>
        <Clause n="8.6">Due to the dependence on billing records from foreign telecom operators, billing for roaming services may appear in a subsequent invoice period.</Clause>
        <Clause n="8.7">When the subscriber is abroad and their device is turned on, the device will be identified by one of the cellular networks available in the region. The subscriber is entitled to change the network manually from their device.</Clause>
        <Clause n="8.8">What is stated above does not include the use of Palestinian Authority networks or use in Jordan and Egypt. In order to allow the use of these networks, the subscriber must contact the company's customer service. The device may roam unintentionally on Jordanian or Egyptian telephone networks, especially in areas near the borders.</Clause>
        <Clause n="8.9">For further information on international roaming, please contact customer service.</Clause>

        {/* 9. Interruption */}
        <H2>9. Interruption of Services</H2>
        <Clause n="9.1">Despite the efforts of the partner network to provide extensive coverage, services are available only in the radius covered by its antennas in Israel. Some areas are not covered or have less coverage by the network.</Clause>
        <Clause n="9.2">For a variety of reasons, the company may not be able to continue to provide the exact same network coverage that existed at the time of entering into this agreement. The scope and quality of the services are subject to a license.</Clause>
        <Clause n="9.3">Restrictions, geographic conditions, weather, radio interference, outages, maintenance, safety and security issues, including networks of other parties to which the network is connected, and other elements, may disturb the service or negatively affect the coverage or quality of service in Israel and/or abroad.</Clause>

        {/* 10. Service Center */}
        <H2>10. Service Center</H2>
        <Clause n="10.1">The company operates a customer service center to receive inquiries and provide answers regarding all communication services. You can contact the service center by phone, WhatsApp, or on the company's website. The service center can be reached throughout the week, except Saturdays and holidays. Opening hours: Sunday to Thursday 9:00 am – 6:00 pm, Fridays and holiday eves 9:00 am – 12:00 pm.</Clause>
        <Clause n="10.2">In the event of a network outage, loss or theft of terminal equipment, or international roaming services — you may contact us via WhatsApp outside of business hours.</Clause>
        <Clause n="10.3">The subscriber must notify the company immediately upon becoming aware of theft or loss of equipment. In case of theft, the company will block the use of the SIM, free of charge, as soon as possible.</Clause>
        <Clause n="10.4">In addition to blocking the SIM card, in case of loss or theft, the subscriber is entitled to ask the company, free of charge, to block the device IMEI registered on their account.</Clause>

        {/* 11. Security */}
        <H2>11. Security of Information and Appropriate Use</H2>
        <Clause n="11.1">The information programmed on the SIM or on the phone must not be changed unless it is information that must be modified by the subscriber.</Clause>
        <Clause n="11.2">It is forbidden to use the services for illegal or harmful purposes or to cause any damage or disturbance, and it is forbidden to allow others to do the same.</Clause>
        <Clause n="11.3">It is forbidden to disturb the functioning of the network, to endanger it, to disturb others, or to put others in danger.</Clause>
        <Clause n="11.4">The subscriber is obligated to inform the company immediately if their device or SIM card is lost or stolen. The subscriber will pay for the use of the service until the notification of the theft or loss.</Clause>
        <Clause n="11.5">This agreement is personal and the subscriber is not authorized to provide the services to others, either with or without compensation.</Clause>
        <Clause n="11.6">The company is entitled to disconnect a subscriber from the network or limit services in any situation allowed by law if an essential clause of the agreement is violated, if the subscriber does not pay their debts, or if asked for a guarantee they have not provided. Cases where disconnection may occur without prior notice include: illegal use, non-payment of an invoice for the third time in twelve months, a reasonable presumption of fraud, or emergency circumstances.</Clause>
        <Clause n="11.7">The company is entitled to charge a re-connection fee and to agree on reconnection only under conditions to be determined at the time of renewal.</Clause>

        {/* 12. Identity theft */}
        <H2>12. Identity Theft and Official Communication</H2>
        <Clause n="12.1">The company communicates only through official and secure channels, such as its phone numbers, platforms, or email addresses listed on its website. It disclaims any responsibility in the event of identity theft by third parties impersonating its representatives.</Clause>
        <Clause n="12.2">If in doubt about the authenticity of a communication attributed to the company, the subscriber is encouraged to verify directly through the official website or the phone number provided on our platforms. Do not respond to suspicious requests.</Clause>

        {/* 13. Security and Backup */}
        <H2>13. Security and Backup</H2>
        <Clause n="13.1">The company recommends that the subscriber take appropriate security measures for their device, such as using a passcode. The company recommends not loading software from unknown sources, not opening unknown files, and using appropriate data security measures.</Clause>
        <Clause n="13.2">The company is not responsible for any damage that may be caused by viruses and other security issues.</Clause>
        <Clause n="13.3">In order to avoid loss of data in case of damage or loss of the device, it is recommended to back up data stored on the device.</Clause>

        {/* 14. Privacy */}
        <H2>14. Privacy Protection</H2>
        <Clause n="14.1">The company shall take reasonable and acceptable safeguards to protect the subscriber's privacy. Information provided at the time of signing the contract will be stored in a computer database to operate, provide, and develop the company's services, billing, customer relations, and marketing. Subscribers do not have a legal obligation to give personal details, but if they do not provide certain information, the company may not be able to provide certain services.</Clause>
        <Clause n="14.2">In accordance with the provisions of the law, Wiretap Act of 1979, the Protection of Privacy Act of 1981, and any other law concerning the protection of privacy, the company shall not be entitled to listen to the subscriber's telecommunication messages without prior written authorization, except in the case of verification and quality control of the service, or to prevent and/or manage fraud.</Clause>
        <Clause n="14.3">The company is entitled to record telephone conversations with the subscriber in connection with the provision of the services for purposes of documentation, quality control, and the prevention of fraud. The company is entitled to collect, store, and document personal data and information collected regarding the provision of services.</Clause>
        <Clause n="14.4">The company may give information to a third party working for it and/or on its behalf, provided that this third party undertakes to maintain the privacy of the subscriber.</Clause>
        <Clause n="14.5">The company will not use the subscriber's information for third-party publications without the subscriber's agreement.</Clause>
        <Clause n="14.6">The subscriber is aware that their telephone number will be identified in any outgoing call/message unless they request the blocking of their number. This block may be removed prior to any call.</Clause>
        <Clause n="14.7">By sending SMS messages or calling emergency calls, the telephone number will be visible to the recipient even if the subscriber has requested that their number be blocked.</Clause>
        <Clause n="14.8">The subscriber confirms awareness that when surfing the internet and/or downloading applications or services from third parties, the information of the electronic device and subscription may be disclosed to those third parties.</Clause>
        <Clause n="14.9">The subscriber is entitled to receive information relating to them from the company, concerning the situation of their account, only after having identified themselves with a representative of the company.</Clause>
        <Clause n="14.10">The information submitted, collected, or received by the company may be used to send advertisements on its behalf and for marketing and surveys. The subscriber is entitled to terminate the receipt of specific advertisements by email and SMS by contacting the service center.</Clause>
        <Clause n="14.11">The company has the right to disclose subscriber information received in connection with the services to other relevant parties in Israel or abroad, in accordance with applicable law: in order to collect payments, pursuant to legal authority, or for the provision of services through third parties.</Clause>
        <Clause n="14.12">The company will allow the public emergency service centers to identify the subscriber's telephone number at the time of the call, even if the subscriber has requested blocking, so that in case of emergency it is possible to locate the subscriber by the public emergency services such as Magen David Adom, the Israeli police, and firefighters.</Clause>
        <Clause n="14.13">The subscriber must update the company of any changes to their details so that the company can provide public emergency services with access to the subscriber.</Clause>
        <Clause n="14.14">The company is entitled to take various security measures to protect the network, including filtering and screening, and the subscriber authorizes the company to take these actions.</Clause>

        {/* 15. Rates */}
        <H2>15. Company Rates</H2>
        <Clause n="15.1">Rates and other charges will be determined according to the rate plan and the company's general rates. The subscriber must check the rate plans on the company's website for further details.</Clause>
        <Clause n="15.2">The company may set new rates or update its rates, subject to applicable law and the subscriber's rate plan. Rate changes may also occur due to external circumstances such as instructions from the Ministry of Communication, changes in laws, court decisions, or changes in the rates of other companies.</Clause>
        <Clause n="15.3">The price and terms of purchase of products and services of third-party suppliers purchased through the company must be checked by the subscriber before buying or ordering.</Clause>
        <Clause n="15.4">The rate of sending an SMS message is a rate for each message sent by the subscriber and is not conditional upon its receipt by the addressee.</Clause>
        <Clause n="15.5">The company's fixed rates for calls are specified per minute and are measured per unit time of one second unless explicitly stated otherwise.</Clause>
        <Clause n="15.6">Up-to-date information on the company's rates can be obtained by contacting the company's customer service or by consulting the company's website at <a href="https://www.bitlink.co.il" className="text-link-blue">www.bitlink.co.il</a>.</Clause>
        <Clause n="15.7">The company is entitled to charge a fee to the subscriber for a change or switch of package and/or subscription.</Clause>
        <Clause n="15.8">The rates and prices of the company as listed in contracts and agreements include VAT (value-added tax) where applicable.</Clause>
        <Clause n="15.9">The company's data consumption rates are determined per 1MB. Volume consumption below 1MB will be rounded upwards.</Clause>

        {/* 16. Invoice */}
        <H2>16. Subscriber Invoice</H2>
        <Clause n="16.1">From time to time, the company will issue and send to the subscriber an invoice detailing the charges for the services used during the last billing period, including any late interest charges or collection charges.</Clause>
        <Clause n="16.2">The subscriber's invoice will include and detail all the information and data required under the license and the law.</Clause>
        <Clause n="16.3">If a credit is given to the subscriber from the company, it will be added to the subscriber's account immediately after the company has determined the subscriber's entitlement to such a credit.</Clause>
        <Clause n="16.4">The invoice of the subscriber will be sent to the subscriber by e-mail or by any other means agreed upon between the subscriber and the company.</Clause>
        <Clause n="16.5">At the subscriber's request, the company shall issue the subscriber with a call detail. The company will be entitled to charge a fee for the production and delivery of call details.</Clause>
        <Clause n="16.6">The company will be entitled to issue and/or send the subscription invoice and/or the details of the calls through a third party acting on its behalf.</Clause>
        <Clause n="16.7">Each monthly payment shall be subject to VAT at the rate applied on the date of issue of the invoice.</Clause>

        {/* 17. Payment */}
        <H2>17. Invoice Payment</H2>
        <Clause n="17.1">The subscriber shall pay the company the amount of payment as stated in the subscriber's account by credit card and/or by direct debit, as determined by the company.</Clause>
        <Clause n="17.2">The subscriber shall ensure that the means of payment provided to the company will be honored by the bank or the credit card company. The provision of services is conditional on the authorization of the means of payment.</Clause>
        <Clause n="17.3">If the payment method has been canceled or has changed, the subscriber must notify the company and immediately provide an alternate means of payment. The subscriber must verify that the authorization to use the means of payment will be valid as long as they are subscribed and have outstanding debts.</Clause>
        <Clause n="17.4">The company is entitled to demand a security or guarantee from the subscriber. Until the subscriber has submitted the deposit or guarantee, the company may limit access to all services in whole or in part.</Clause>
        <Clause n="17.5">The company will return the security or guarantee after the termination of this agreement, provided the subscriber has fulfilled all obligations. The company is not obligated to return the guarantee before one month has elapsed from the date of cessation of services.</Clause>
        <Clause n="17.6">The company is entitled to limit the amount of debt that the subscriber is allowed to accumulate and reserves the right to disconnect services if this limit is exceeded.</Clause>

        {/* 18. Late Payment */}
        <H2>18. Interest on Late Payment and Collection Fees</H2>
        <Clause n="18.1">Any payment not paid by the subscriber on the date fixed for its payment will be subject to interest and penalties, commencing from the date of the fixed payment and up to the date of actual payment.</Clause>
        <Clause n="18.2">The interest rate on late payments shall not exceed the rate fixed according to applicable law. Information on late payment interest is available upon request from the company's customer service or on the company's website.</Clause>
        <Clause n="18.3">The company will charge the subscriber with payment of collection expenses for any payment not made by the subscriber on the fixed date, provided that at least fourteen (14) days have elapsed since the date of payment. The recovery fee rate will be up to 10% of the subscriber's total debt to the company (plus VAT) and in any case will not be less than fifty (50) shekels (plus VAT). If the company requires legal proceedings against the subscriber for non-payment, these proceedings will be subject to additional fees that will be the sole responsibility of the subscriber.</Clause>

        {/* 19. Liability */}
        <H2>19. Exemption from Liability; Limitation of Liability</H2>
        <Clause n="19.1">The company, its employees, and all those acting on its behalf shall bear no contractual liability or responsibility for any damage other than direct damage caused by the limitation or termination of the services and damage resulting from intentional or gross negligence of the company.</Clause>
        <Clause n="19.2">The company, its employees, and all those acting on its behalf shall not be held liable in the event of exemption from liability in accordance with section 41 of the Communications Act 1982, including damage caused by failure to supply services, suspension, or termination as a result of deliberate actions required for telecommunications operations.</Clause>
        <Clause n="19.3">Additionally, the company shall bear no responsibility for any damage caused as a result of circumstances beyond its control, including supreme force, fire, war, terrorism, serious public order riots, acts or failures of another communication provider, laws, decrees, military or security restrictions, or other factors beyond the control of the company.</Clause>
        <Clause n="19.4">The quality and existence of the service depend on the nature of the connection of the device to the cellular and partner network, as well as factors not controlled by the company, such as weather conditions, difficulties in authorizing the establishment of antennas, etc.</Clause>
        <Clause n="19.5">For various technical reasons, some data transmitted via SMS messages and mobile internet links may not reach their intended recipient, or may delay or arrive damaged. The company does its best to prevent such failures but does not guarantee faultless service.</Clause>

        {/* 20. Complaints */}
        <H2>20. Management of Public Complaints</H2>
        <Clause n="20.1">The company has appointed a Public Complaints Officer whose role is to investigate the complaints of subscribers regarding the services and invoices.</Clause>
        <Clause n="20.2">The Public Complaints Officer will respond in writing to complaints received in writing.</Clause>
        <Clause n="20.3">Complaints may be submitted by:
          <ul className="mt-2 list-disc pl-6">
            <li>Email: <a href="mailto:support@bitlink.co.il" className="text-link-blue">support@bitlink.co.il</a></li>
            <li>WhatsApp: +972-58-793-9426</li>
            {/* ⚠️ TODO: Add postal address once available */}
          </ul>
        </Clause>
        <Clause n="20.4">Any differences of opinion that may arise between the company and the subscriber shall be forwarded for investigation to the complaints manager. This does not prevent the subscriber or the company from bringing the matter before the authorized courts.</Clause>

        {/* 21. Subscriber Liabilities */}
        <H2>21. Subscriber Liabilities and Plans</H2>
        <Clause n="21.1">The subscriber undertakes to act in good faith and in an acceptable manner, to make fair use of the communication services, and not to do or act in any manner which constitutes or is likely to be considered as abuse.</Clause>
        <Clause n="21.2">Unlimited packages refer to use in Israel only, and are subject to reasonable and fair personal use, in good faith and in an acceptable manner. The device must not be connected to a central unit of a computer, broadcast device, external software, etc.</Clause>
        <Clause n="21.3">Personal use does not include: (a) commercial/political use such as telemarketing, surveys, message distribution, advertising, or sales force; (b) use that provides a service to others; (c) indirect use including via website; (d) malicious use or abuse.</Clause>
        <Clause n="21.4">Without detracting from the above, usage greater than 199 different monthly recipients during a single billing cycle, a call lasting more than 120 minutes, or the sending of more than 5,000 monthly SMS, shall be considered as non-personal, non-reasonable use.</Clause>
        <Clause n="21.5">In case of non-personal use, the subscriber will be charged for uses according to the current rate multiplied by the amount concerned. The company will also be entitled to limit or terminate the subscriber's services.</Clause>
        <Clause n="21.6">The packages do not include video calls, calls and sending messages to services, games, star numbers, special numbers, etc. These will be charged according to specific rates. Additionally, the packages do not include calls to networks of the Palestinian Authority and to international operators unless specifically included in the plan.</Clause>
        <Clause n="21.7">Upon selection of a package, all conditions/benefits/discounts granted according to the previous package/plan will be canceled.</Clause>
        <Clause n="21.8">The subscriber agrees to treat the company, its employees, representatives, and any associated personnel with respect during all interactions. Any disrespectful, insulting, aggressive, or defamatory behavior may result in suspension or termination of the contract at the company's discretion.</Clause>

        {/* 22. Cancellation */}
        <H2>22. Cancellation / Termination of Contract / Services</H2>
        <Clause n="22.1">The subscriber is entitled to cancel their contract at any time and to request the termination of services by request addressed to the company by the following means (preferably by email):
          <ul className="mt-2 list-disc pl-6">
            <li>Email: <a href="mailto:support@bitlink.co.il" className="text-link-blue">support@bitlink.co.il</a></li>
            <li>WhatsApp: +972-58-793-9426</li>
            {/* ⚠️ TODO: Add phone and postal address */}
          </ul>
        </Clause>
        <Clause n="22.2">The termination request must include the subscriber's name and identity number.</Clause>
        <Clause n="22.3">A subscriber who requests termination of service will receive a final invoice corresponding to the last month of use, sent in the subsequent billing cycle.</Clause>
        <Clause n="22.4">The porting out of the Israel telephone number (line) shall be considered as a request of the subscriber for the termination of the contract.</Clause>
        <Clause n="22.5">The services may be temporarily suspended once a year for a period of 30 to 90 days. The interruption does not exempt the subscriber from paying debts in accordance with the contract. The company will renew the interrupted services at the end of the period of discontinuation without prior announcement.</Clause>
        <Clause n="22.6">The subscriber is entitled to terminate and disconnect permanently from any service of the company. The termination and cessation of invoicing will be carried out on the date specified by the subscriber, or at the latest one working day from the reception of the request. The final bill will be sent to the subscriber within two months of termination.</Clause>
        <Clause n="22.7">The company shall be entitled to cancel the contract and cease to provide services if the subscriber has not paid the bills on time, if there is a reasonable suspicion of fraud, if the subscriber has been declared bankrupt, or in any other case for which the company is obliged or entitled to do so according to the license and/or the law.</Clause>
        <Clause n="22.8">In case of suspicion of illegal use of the device/card, according to the parameters of the company, the service will be disconnected.</Clause>
        <Clause n="22.9">The company will be entitled to reduce the speed of transfer of the subscriber's data in any of the following cases: (1) the subscriber has made dishonest use; (2) the subscriber makes use of the services three times higher than the average; (3) the extent of connection services used disrupts the operation of the network; (4) the subscriber uses connection services for the purpose of file sharing software between different users.</Clause>
        <Clause n="22.10">The company is entitled to disconnect or temporarily limit the services, in whole or in part, due to maintenance operations, disruption in provision of services, emergency, or national security reasons.</Clause>
        <Clause n="22.11">In the event that the subscriber joined the company's communication services through 'remote sales' and the subscriber is a 'consumer' within the meaning of the Consumer Protection Act 1981:
          <ul className="mt-2 list-disc pl-6">
            <li>The subscriber has the option to cancel the transaction within 14 days of joining the services.</li>
            <li>The subscriber will be billed a cancellation fee of 5% of the purchase price or 100 shekels, whichever is lower.</li>
            <li>In all cases, the subscriber will have to pay the amount of services used until the date of cancellation.</li>
            <li>A cancellation following a written request will come into effect within one business day unless otherwise stated in the application.</li>
          </ul>
        </Clause>

        {/* Annex 1 */}
        <div className="mt-12 border-t-2 border-slate-400 pt-8">
          <h2 className="mb-4 text-center text-base font-bold text-slate-800">ANNEX 1 — KOSHER PLAN TERMS AND CONDITIONS</h2>
          <p className="mb-3 italic leading-7 text-slate-500">The following terms apply exclusively to subscribers on Kosher Basic and Kosher+ plans. In the event of a contradiction between the provisions of this annex and any other provision in the general agreement, the provisions of this annex shall prevail.</p>

          <H2>Definitions</H2>
          <Clause n="1.1">"Vaad Harabanim" — The Vaad for Communication Services (Vaadat Harabanim linyanei tikshoret), registration number 850440824, established by rabbis appointed by the great scholars and leaders of Israel. It is authorized to approve mobile devices and phone numbers for the religious Jewish public in accordance with their instructions, including restrictions, blocks, and usage limitations.</Clause>
          <Clause n="1.2">"Kosher Phone" — A device that complies with the decisions of the Vaadat Harabanim for Communication Services, certified and identified as such. It does not allow access to the internet, sending or receiving SMS, MMS, etc., and operates only with a Kosher SIM card.</Clause>
          <Clause n="1.3">"Kosher SIM" — A SIM card approved by the Vaadat Harabanim as kosher, allowing access to the company's services. When used in a Kosher Phone, only authorized services will be available, and only through a Kosher number.</Clause>
          <Clause n="1.4">"Kosher Number" — A number linked to a Kosher plan, usable with a Kosher device and SIM card, for phone calls and their associated functions only. No other services (Internet, SMS, MMS, etc.) are permitted.</Clause>
          <Clause n="1.5">"Blocked Number" — Numbers, prefixes, number ranges, or calling cards whose calls to or from a kosher plan line are blocked, as defined and periodically updated by the Vaadat Harabanim.</Clause>

          <H2>Kosher Plan Provisions</H2>
          <Clause n="2">The use of a kosher device will only be possible with a kosher SIM card and a number belonging to the kosher number range. The subscriber will not be able to replace their phone number with one that does not belong to the kosher range.</Clause>
          <Clause n="3">The subscriber acknowledges and agrees that the service center may be limited in accordance with the guidelines of the Vaadat Harabanim, including closure on Shabbat and Jewish holidays.</Clause>
          <Clause n="4">The subscriber acknowledges that the kosher number and kosher device are limited in their functionalities and that neither they, the company, nor any other person, are permitted to make changes to the kosher SIM card, kosher number, or kosher device at any time without written approval from the Vaadat Harabanim.</Clause>
          <Clause n="5">The kosher number only allows phone calls (except for blocked numbers and subject to the Vaadat Harabanim's decisions). Excluded services include: internet access, sending/receiving SMS, MMS, and any similar services.</Clause>
          <Clause n="6">Calls made with a kosher device, SIM card, or number will be blocked to forbidden numbers as defined by the Vaadat Harabanim. A number chosen by the client that appears on the blocked list will be canceled without prior notice.</Clause>
          <Clause n="7">The subscriber agrees not to use a kosher SIM card in a non-certified kosher device, nor to insert a non-kosher SIM card into a kosher device.</Clause>
          <Clause n="8">It is not possible to transfer calls from kosher numbers to non-kosher numbers or numbers not subject to the Vaadat Harabanim's guidelines, even if the transfer is done indirectly.</Clause>
          <Clause n="9">It is prohibited to remove, alter, conceal, or reproduce the Vaadat Harabanim's identification mark, or to apply it to another device, document, or object.</Clause>
          <Clause n="10">If the client wishes to transfer their number to another operator, they can only do so with a company that has a valid legal agreement with the Vaadat Harabanim and only to a set of specific services compliant with the Vaadat Harabanim's guidelines.</Clause>
          <Clause n="11">Upon receiving their Kosher SIM card, the client will only be able to access all associated features after completing the authentication process. The client must make a call, during which a reminder of the conditions outlined in this annex will be presented via a recorded voice message. The client must validate these conditions to activate the Kosher SIM card.</Clause>
          <Clause n="12">This annex forms an integral part of the general terms and conditions of use. It does not replace them but complements them and adds to the existing provisions.</Clause>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <p>BitLink Ltd. · <a href="https://www.bitlink.co.il" className="hover:text-link-blue">bitlink.co.il</a> · <a href="mailto:support@bitlink.co.il" className="hover:text-link-blue">support@bitlink.co.il</a></p>
          <p className="mt-1">These terms and conditions are subject to Israeli telecommunications law and may be updated from time to time.</p>
        </div>
      </div>
    </>
  );
}
