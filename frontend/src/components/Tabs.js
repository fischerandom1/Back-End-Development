import { useState } from "react";
import { useAtom } from "jotai";
import { selectedTabAtom } from "../views/pages/HistoryPage.js";

function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useAtom(selectedTabAtom);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <>
      <div className="d-flex">
        {tabs.map((tab, idx) => {
          return (
            <button
              key={idx}
              className={`btn m-0 ${
                activeTab === tab.id ? "btn-primary text-white" : "btn-secondary"
              }`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.name}
            </button>
         );
        })}
      </div>
      {/* <div className="mt-2 p-4">
        {tabs.map((tab) => (
          <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
            {tab.content}
          </div>
        ))}
      </div> */}
    </>
  );
}

export default Tabs;