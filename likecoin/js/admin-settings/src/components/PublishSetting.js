import {
  useRef, useState, useEffect, useImperativeHandle, forwardRef,
} from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import Section from './Section';
import CheckBox from './CheckBox';
import MattersDescription from './Matters/MattersDescription';
import MattersLoginTable from './Matters/MattersLoginTable';
import MattersStatusTable from './Matters/MattersStatusTable';
import { SITE_PUBLISH_STORE_NAME } from '../store/site-publish-store';

function PublishSetting(_, ref) {
  // eslint-disable-next-line arrow-body-style
  const {
    DBSiteMattersId,
    DBSiteMattersAutoSaveDraft,
    DBSiteMattersAutoPublish,
    DBSiteMattersAddFooterLink,
  } = useSelect((select) => select(SITE_PUBLISH_STORE_NAME).selectSitePublishOptions());
  const {
    postSitePublishOptions,
    siteMattersLogin,
    siteMattersLogout, updateSiteMattersLoginGlobalState,
  } = useDispatch(SITE_PUBLISH_STORE_NAME);
  const mattersIdRef = useRef();
  const mattersPasswordRef = useRef();
  const siteMattersAutoSaveDraftRef = useRef();
  const siteMattersAutoPublishRef = useRef();
  const siteMattersAddFooterLinkRef = useRef();
  const [showMatters, setShowMatters] = useState(!!(DBSiteMattersId
    || DBSiteMattersAutoSaveDraft || DBSiteMattersAutoPublish));
  const [siteMattersId, setSiteMattersId] = useState(
    DBSiteMattersId,
  );
  const [siteMattersAutoSaveDraft, setSiteMattersAutoSaveDraft] = useState(
    DBSiteMattersAutoSaveDraft,
  );
  const [siteMattersAutoPublish, setSiteMattersAutoPublish] = useState(
    DBSiteMattersAutoPublish,
  );
  const [siteMattersAddFooterLink, setSiteMattersAddFooterLink] = useState(
    DBSiteMattersAddFooterLink,
  );
  const [mattersLoginError, setMattersLoginError] = useState('');

  async function loginToMattersAndSaveDataToWordpress(data) {
    try {
      // change DB
      const mattersLoginResponse = await siteMattersLogin(data);
      if (!mattersLoginResponse) {
        throw new Error('Calling Server failed.');
      }
      if (mattersLoginResponse.errors) {
        let errorMessage = 'ERROR:';
        if (mattersLoginResponse.errors.length > 0) {
          mattersLoginResponse.errors.forEach((e) => {
            if (e.message.indexOf('password') > 0) {
              const passwordIndex = e.message.search('password');
              errorMessage = errorMessage.concat(
                e.message.slice(0, passwordIndex).concat('password: "***"}'),
              );
            } else {
              errorMessage = errorMessage.concat(e.message);
            }
          });
        }
        setMattersLoginError(errorMessage);
        return;
      }
      const siteMattersUser = {
        mattersId: mattersLoginResponse.viewer.userName,
        accessToken: mattersLoginResponse.userLogin.token,
      };

      // change global state
      updateSiteMattersLoginGlobalState(siteMattersUser);
      setMattersLoginError(__('Success', 'likecoin'));
      // change local state
      setSiteMattersId(siteMattersUser.mattersId);
    } catch (error) {
      console.error(error);
    }
  }

  async function loginHandler(e) {
    e.preventDefault();
    const mattersId = mattersIdRef.current.value;
    const mattersPassword = mattersPasswordRef.current.value;
    const data = {
      mattersId,
      mattersPassword,
    };
    // send to Matters API.
    await loginToMattersAndSaveDataToWordpress(data);
  }
  async function handleMattersLogout(e) {
    e.preventDefault();

    // set local state
    setSiteMattersId('');

    const siteMattersUser = {
      mattersId: '',
      accessToken: '',
    };
    // change DB
    await siteMattersLogout();
    // change global state
    updateSiteMattersLoginGlobalState(siteMattersUser);
  }

  async function confirmHandler() {
    if (!showMatters) return;
    const isSiteMattersAutoSaveDraft = siteMattersAutoSaveDraftRef.current.checked;
    const isSiteMattersAutoPublish = siteMattersAutoPublishRef.current.checked;
    const isSiteMattersAddFooterLink = siteMattersAddFooterLinkRef.current.checked;

    const data = {
      siteMattersAutoSaveDraft: isSiteMattersAutoSaveDraft,
      siteMattersAutoPublish: isSiteMattersAutoPublish,
      siteMattersAddFooterLink: isSiteMattersAddFooterLink,
    };
    postSitePublishOptions(data);
  }

  useEffect(() => {
    setShowMatters(DBSiteMattersId || DBSiteMattersAutoSaveDraft || DBSiteMattersAutoPublish);
    setSiteMattersId(DBSiteMattersId);
    setSiteMattersAutoSaveDraft(DBSiteMattersAutoSaveDraft);
    setSiteMattersAutoPublish(DBSiteMattersAutoPublish);
    setSiteMattersAddFooterLink(DBSiteMattersAddFooterLink);
  }, [
    DBSiteMattersId,
    DBSiteMattersAutoSaveDraft,
    DBSiteMattersAutoPublish,
    DBSiteMattersAddFooterLink,
  ]);

  useImperativeHandle(ref, () => ({
    submit: confirmHandler,
  }));
  return (
    <>
      <Section title={__('Publish to other platforms', 'likecoin')} />
      <p>{__('LikeCoin plugin can help you to publish you post to other platform.', 'likecoin')}</p>
      <CheckBox
        checked={showMatters}
        handleCheck={setShowMatters}
        title={__('Matters', 'likecoin')}
        details={__('Publish to Matters.news', 'likecoin')}
      />
      {showMatters && (
        <>
          <Section title={__('Login with Matters ID', 'likecoin')} />
          <MattersDescription />
          {!siteMattersId && <MattersLoginTable
            loginHandler={loginHandler}
            mattersIdRef={mattersIdRef}
            mattersPasswordRef={mattersPasswordRef}
            mattersLoginError={mattersLoginError}
          />}
          <hr />
          <Section title={__('Matters connection status', 'likecoin')} />
          <MattersStatusTable
            siteMattersId={siteMattersId}
            handleMattersLogout={handleMattersLogout}
          />
          <Section title={__('Publish to Matters', 'likecoin')} />
          <table className="form-table" role="presentation">
            <tbody>
              <CheckBox
                checked={siteMattersAutoSaveDraft}
                handleCheck={setSiteMattersAutoSaveDraft}
                title={__('Auto save draft to Matters', 'likecoin')}
                details={__('Auto save draft to Matters', 'likecoin')}
                checkRef={siteMattersAutoSaveDraftRef}
              />
              <CheckBox
                checked={siteMattersAutoPublish}
                handleCheck={setSiteMattersAutoPublish}
                title={__('Auto publish post to Matters', 'likecoin')}
                details={__('Auto publish post to Matters', 'likecoin')}
                checkRef={siteMattersAutoPublishRef}
              />
              <CheckBox
                checked={siteMattersAddFooterLink}
                handleCheck={setSiteMattersAddFooterLink}
                title={__('Add post link in footer', 'likecoin')}
                details={__('Add post link in footer', 'likecoin')}
                checkRef={siteMattersAddFooterLinkRef}
              />
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

export default forwardRef(PublishSetting);
