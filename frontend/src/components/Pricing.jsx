import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, CreditCard, Plus, Minus } from 'lucide-react';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: 'How is usage calculated?',
      answer: 'Usage is calculated based on the number of active API schemas, database operations, and AI-powered generation requests made within a billing cycle.'
    },
    {
      question: 'What is Basic Usage and Bonus Usage?',
      answer: 'Basic Usage covers your standard plan limits for API builds and hosting. Bonus Usage allows you to exceed these limits at a discounted rate without upgrading your entire plan.'
    },
    {
      question: 'Do different database types consume usage differently?',
      answer: 'Standard SQL databases (PostgreSQL, MySQL) consume base usage, while NoSQL (MongoDB) or high-concurrency clusters may have slightly different compute resource tracking.'
    },
    {
      question: 'What happens when I run out of usage?',
      answer: 'Once your limit is reached, you can either upgrade your plan or enable "Pay-as-you-go" bonus usage to keep your APIs running smoothly without interruption.'
    },
    {
      question: 'How do I get and use a Pro trial?',
      answer: 'New users can activate a 14-day Pro trial from the dashboard. This gives you full access to unlimited schemas and MySQL support to test the platform.'
    },
    {
      question: 'What happens if an AI schema generation fails?',
      answer: 'Failed AI requests do not count towards your usage quota. You can refine your prompt and retry without any additional cost.'
    },
    {
      question: 'Can I request a refund?',
      answer: 'Yes, we offer a 7-day money-back guarantee if you are not satisfied with our platform. Please contact our support team for assistance.'
    }
  ];

  const plans = [
    // ... existing plans ...
    {
      name: 'Lite',
      price: '3',
      features: [
        '$5 Basic usage + Bonus usage',
        'Unlimited Autocomplete',
        'Up to 2 concurrent cloud tasks in TRAE SOLO (Web/Desktop)'
      ],
      buttonText: 'Upgrade plan',
      recommended: false
    },
    {
      name: 'Pro',
      price: '10',
      features: [
        '$20 Basic usage + Bonus usage',
        'Unlimited Autocomplete',
        'TRAE IDE - SOLO mode included',
        'Up to 10 concurrent cloud tasks in TRAE SOLO (Web/Desktop)'
      ],
      buttonText: 'Upgrade plan',
      recommended: true
    },
    {
      name: 'Pro+',
      price: '30',
      features: [
        '3.5x more usage than Pro',
        'Up to 15 concurrent cloud tasks in TRAE SOLO (Web/Desktop)'
      ],
      buttonText: 'Upgrade plan',
      recommended: false,
      subtext: 'Everything in Pro, plus:'
    },
    {
      name: 'Ultra',
      price: '100',
      features: [
        '20x more usage than Pro',
        'Model early access',
        'Up to 20 concurrent cloud tasks in TRAE SOLO (Web/Desktop)'
      ],
      buttonText: 'Upgrade plan',
      recommended: false,
      subtext: 'Everything in Pro, plus:'
    }
  ];

  const comparisonData = [
    {
      category: 'Monthly Basic Usage',
      free: 'Limited usage',
      lite: '$5 Basic usage + Bonus usage',
      pro: '$20 Basic usage + Bonus usage',
      proPlus: '$90 Basic usage + Bonus usage',
      ultra: '$400 Basic usage + Bonus usage'
    },
    {
      category: 'Queue Priority',
      free: { icon: 'standard', text: 'Standard queue' },
      lite: { icon: 'fast', text: 'Fast queue' },
      pro: { icon: 'fast', text: 'Fast queue' },
      proPlus: { icon: 'fast', text: 'Fast queue' },
      ultra: { icon: 'fast', text: 'Fast queue' }
    },
    {
      category: 'Autocompletion',
      free: '5000 / month',
      lite: 'Unlimited',
      pro: 'Unlimited',
      proPlus: 'Unlimited',
      ultra: 'Unlimited'
    },
    {
      category: 'Concurrent Cloud Tasks',
      free: '2',
      lite: '2',
      pro: '10',
      proPlus: '15',
      ultra: '20'
    },
    {
      category: 'Database Support',
      free: 'SQLite only',
      lite: 'Postgres / Mongo',
      pro: 'All (incl. MySQL)',
      proPlus: 'All (incl. MySQL)',
      ultra: 'All (incl. MySQL)'
    },
    {
      category: 'Support Level',
      free: 'Community',
      lite: 'Community',
      pro: 'Email',
      proPlus: 'Priority',
      ultra: 'Dedicated Manager'
    }
  ];

  return (
    <div className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <h1 className="text-white text-6xl font-medium text-center mb-12 tracking-tight">Pricing</h1>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-16">
          <div className="bg-[#1a1a1a] p-1 rounded-md flex border border-[#333]">
            {['One-Month', 'Monthly', 'Yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle.toLowerCase())}
                className={`px-8 py-2 rounded-md text-sm transition-all ${
                  billingCycle === cycle.toLowerCase()
                    ? 'bg-[#333] text-white'
                    : 'text-[#888] hover:text-white'
                }`}
              >
                {cycle} {cycle === 'Yearly' && <span className="text-[#00ffaa] ml-1 text-xs font-normal">Save 25%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-[#0f0f0f] border rounded-md p-8 flex flex-col min-h-[500px] ${
                plan.recommended ? 'border-[#00ffaa]' : 'border-[#1a1a1a]'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-4 right-4 border border-[#00ffaa] text-[#00ffaa] text-[10px] px-2 py-0.5 rounded">
                  Recommended
                </div>
              )}

              <h3 className={`text-xl mb-8 flex items-center gap-2 font-medium ${plan.name === 'Pro' || plan.name === 'Lite' || plan.name === 'Pro+' || plan.name === 'Ultra' ? 'text-[#00ffaa]' : 'text-white'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffaa]" />
                {plan.name}
              </h3>

              <div className="mb-2">
                <span className="text-white text-5xl font-medium">${plan.price}</span>
              </div>
              <p className="text-[#888] text-sm mb-8 font-normal">per month, billed monthly</p>

              {plan.subtext && (
                <p className="text-[#888] text-sm mb-4 font-normal">{plan.subtext}</p>
              )}

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check size={14} className="text-[#00ffaa] mt-1 shrink-0" />
                    <span className="text-white text-sm leading-tight font-normal">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 rounded-md text-sm font-medium transition-all ${
                  plan.recommended
                    ? 'bg-[#00ffaa] text-black hover:bg-[#00e699]'
                    : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Methods Section */}
        <div className="text-center mb-20">
          <p className="text-[#888] text-sm mb-8 font-normal">Most payment methods supported for upgrade</p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
             {/* Simple placeholders for payment logos as seen in image */}
             <div className="flex items-center gap-2 text-white font-medium text-xl italic">PayPal</div>
             <div className="flex items-center gap-2 text-white font-black text-2xl tracking-tighter">VISA</div>
             <div className="flex items-center gap-1 text-white font-bold text-xl tracking-tight">
                <div className="w-6 h-6 rounded-full bg-red-500/80 -mr-3" />
                <div className="w-6 h-6 rounded-full bg-yellow-500/80" />
             </div>
             <div className="text-white font-bold text-sm tracking-[0.2em] border border-white/20 px-2 py-0.5 rounded">AMEX</div>
             <div className="text-white font-bold text-xl tracking-tighter">DISCOVER</div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="py-8 text-2xl font-medium text-white w-1/4">Compare Plans</th>
                <th className="py-8 px-4 align-top">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#888]">Free</p>
                    <button className="text-white text-sm font-medium hover:text-[#00ffaa] transition-colors flex items-center gap-1">
                      Download <span className="text-lg">→</span>
                    </button>
                  </div>
                </th>
                <th className="py-10 px-4 align-top">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#00ffaa]">Lite</p>
                    <button className="text-[#888] text-sm font-medium hover:text-white transition-colors flex items-center gap-1">
                      Upgrade plan <span className="text-lg">→</span>
                    </button>
                  </div>
                </th>
                <th className="py-10 px-4 align-top">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#00ffaa]">Pro</p>
                    <button className="text-[#00ffaa] text-sm font-medium hover:text-[#00e699] transition-colors flex items-center gap-1">
                      Upgrade plan <span className="text-lg">→</span>
                    </button>
                  </div>
                </th>
                <th className="py-10 px-4 align-top">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#00ffaa]">Pro+</p>
                    <button className="text-[#888] text-sm font-medium hover:text-white transition-colors flex items-center gap-1">
                      Upgrade plan <span className="text-lg">→</span>
                    </button>
                  </div>
                </th>
                <th className="py-10 px-4 align-top">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#00ffaa]">Ultra</p>
                    <button className="text-[#888] text-sm font-medium hover:text-white transition-colors flex items-center gap-1">
                      Upgrade plan <span className="text-lg">→</span>
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={i} className="border-b border-[#1a1a1a] group hover:bg-white/[0.02] transition-colors">
                  <td className="py-6 text-sm font-medium text-white flex items-center gap-2">
                    {row.category}
                    <Info size={14} className="text-[#333] cursor-help hover:text-[#888]" />
                  </td>
                  
                  {/* Free */}
                  <td className="py-6 px-4 text-sm font-normal text-[#888]">
                    {typeof row.free === 'object' ? (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#888]" />
                        {row.free.text}
                      </div>
                    ) : row.free}
                  </td>

                  {/* Lite */}
                  <td className="py-6 px-4 text-sm font-normal text-white">
                    {typeof row.lite === 'object' ? (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#00ffaa]" />
                        {row.lite.text}
                      </div>
                    ) : row.lite}
                  </td>

                  {/* Pro */}
                  <td className="py-6 px-4 text-sm font-normal text-white">
                    {typeof row.pro === 'object' ? (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#00ffaa]" />
                        {row.pro.text}
                      </div>
                    ) : row.pro}
                  </td>

                  {/* Pro+ */}
                  <td className="py-6 px-4 text-sm font-normal text-white">
                    {typeof row.proPlus === 'object' ? (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#00ffaa]" />
                        {row.proPlus.text}
                      </div>
                    ) : row.proPlus}
                  </td>

                  {/* Ultra */}
                  <td className="py-6 px-4 text-sm font-normal text-white">
                    {typeof row.ultra === 'object' ? (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#00ffaa]" />
                        {row.ultra.text}
                      </div>
                    ) : row.ultra}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

         {/* FAQ Section */}
         <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-white text-4xl font-medium text-center mb-10 tracking-tight">Frequently Asked Questions</h2>
            
            <div className="border-t border-[#1a1a1a]">
               {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-[#1a1a1a]">
                     <button 
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full py-6 flex items-center justify-between text-left group transition-all"
                     >
                        <span className={`text-lg font-normal transition-colors duration-300 ${openFaq === index ? 'text-white' : 'text-[#888] group-hover:text-white'}`}>
                           {faq.question}
                        </span>
                        <div className={`transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-white' : 'text-[#333] group-hover:text-[#888]'}`}>
                           {openFaq === index ? <Minus size={20} /> : <Plus size={20} />}
                        </div>
                     </button>
                     
                     <AnimatePresence>
                        {openFaq === index && (
                           <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                           >
                              <div className="pb-6 text-[#888] text-base font-normal leading-relaxed">
                                 {faq.answer}
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               ))}
            </div>
         </div>
         
         <div className="mt-12 text-center text-[#888] text-sm font-normal pb-20">
          <p>© 2026 AutoBackend. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
