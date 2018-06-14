import browser from "webextension-polyfill";
import React, { Component, Fragment } from "react";
import {
  Button,
  Label,
  Input,
  Select,
  Textarea,
  Switch,
  Small,
  Divider,
  Box
} from "rebass";
import Tabs, { TabPane } from "./popup-tabs";
import micropub from "../modules/micropub";
import { sync as syncBookmarks } from "../modules/bookmarks";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      micropubMe: "",
      micropubToken: "",
      micropubEndpoint: "",
      newPostTemplate: "",
      bookmarkAutoSync: false,
      bookmarksSyncing: false
    };
    browser.storage.local
      .get()
      .then(store => {
        this.setState({
          micropubMe: store.setting_micropubMe,
          micropubToken: store.setting_micropubToken,
          micropubEndpoint: store.setting_micropubEndpoint,
          newPostTemplate: store.setting_newPostTemplate,
          bookmarkAutoSync: store.setting_bookmarkAutoSync ? true : false
        });
      })
      .catch(err => console.log("Error getting local browser settings", err));

    this.handleLogin = this.handleLogin.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSyncBookmarks = this.handleSyncBookmarks.bind(this);
    this.renderBasicItem = this.renderBasicItem.bind(this);
  }

  componentDidMount() {
    browser.runtime.onMessage.addListener((request, sender) => {
      switch (request.action) {
        case "isSyncing": {
          return Promise.resolve(this.state.bookmarksSyncing);
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  handleLogin(e) {
    e.preventDefault();
    micropub
      .getAuthUrl()
      .then(url => {
        browser.storage.local
          .set({
            setting_tokenEndpoint: micropub.options.tokenEndpoint,
            setting_micropubEndpoint: micropub.options.micropubEndpoint
          })
          .then(() => {
            // window.location = url;
            browser.tabs.create({ url });
          })
          .catch(err =>
            console.log("Error setting endpoints in browser storage", err)
          );
      })
      .catch(err => {
        console.log(err);
      });
  }

  handleSyncBookmarks(e) {
    e.preventDefault();
    this.setState({ bookmarksSyncing: true });
    // Do the callback on a timeout to allow the background script time to check if the sync is happening
    syncBookmarks()
      .then(() =>
        setTimeout(() => this.setState({ bookmarksSyncing: false }), 500)
      )
      .catch(err => {
        console.log("Error syncing bookmarks", err);
        setTimeout(() => this.setState({ bookmarksSyncing: false }), 500);
      });
  }

  handleChange(name) {
    return e => {
      let update = {};
      update["setting_" + name] = e.target.value;
      browser.storage.local.set(update);
      this.setState({ [name]: e.target.value });
    };
  }

  renderBasicItem(key, label) {
    return (
      <Fragment>
        <Label htmlFor={"setting" + key}>{label}</Label>
        <Input
          mb={3}
          type="text"
          value={this.state[key]}
          id={"setting" + key}
          onChange={this.handleChange(key)}
        />
      </Fragment>
    );
  }

  render() {
    return (
      <form>
        {this.renderBasicItem("micropubMe", "Domain")}
        {this.state.micropubToken ? (
          <Fragment>
            {this.renderBasicItem("micropubEndpoint", "Micropub endpoint")}
            {this.renderBasicItem("micropubToken", "Micropub token")}
          </Fragment>
        ) : (
          <Button
            disabled={!this.state.micropubMe}
            onClick={this.handleLogin}
            mb={3}
          >
            Login
          </Button>
        )}

        <Label htmlFor={"newPostTemplate"}>New Post Template</Label>
        <Textarea
          mb={3}
          style={{ resize: "vertical" }}
          rows={10}
          value={this.state.newPostTemplate}
          id={"newPostTemplate"}
          onChange={this.handleChange("newPostTemplate")}
        />
        <Small>
          Here you can write blank html code for how posts are displayed on your
          site. Make sure to include the classes "p-name" on your title and
          "e-content" on your content area or the extension will not work. Note:
          This will also automatically be wrapped in a plain &lt;div&gt;
          element.
        </Small>

        <Divider />
        <Label mb={3}>
          <Switch
            mr={1}
            checked={this.state.bookmarkAutoSync}
            onClick={e => {
              let update = {
                setting_bookmarkAutoSync: !this.state.bookmarkAutoSync
              };
              browser.storage.local.set(update);
              this.setState({ bookmarkAutoSync: !this.state.bookmarkAutoSync });
            }}
          />{" "}
          Enable Bookmark Auto Posting
        </Label>
        <Button
          disabled={this.state.bookmarksSyncing}
          onClick={this.handleSyncBookmarks}
        >
          {this.state.bookmarksSyncing ? "Syncing..." : "Sync Bookmarks"}
        </Button>
        <br />
        <Small>
          This will almost certainly not work fully for you. Full bookmark
          syncing requires a micropub query api which does not exist yet. My own
          implementation is just using mongodb query syntax. What should work
          for you is the automatic creation of micropub bookmark posts on your
          site. If you hit the sync button it will push all your browser
          bookmarks as mf2 posts and the extension will automatically create new
          mf2 bookmark posts when you create a browser bookmark
        </Small>
      </form>
    );
  }
}

export default Settings;