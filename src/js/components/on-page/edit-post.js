import React from "react";
import { Group, Button } from "rebass";
import Popout from "./popout";
import PopoutForm from "./popout-form";
import MediumEditor from "medium-editor";
import micropub from "../../modules/micropub";
import * as templateUtils from "../../modules/template-utils";

class PostEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      popoutOpen: false,
      titleEditor: false,
      contentEditor: false,
      mf2: {
        properties: {}
      },
      originalProperties: {}
    };
    this.loadEditor = this.loadEditor.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {}

  handleEdit() {
    this.setState({ open: true });
    this.loadEditor();
  }

  handleDelete() {
    if (window.confirm("Are you sure you want to delete this?")) {
      micropub
        .delete(window.location.href)
        .then(res => {
          // Deleted, lets reload
          window.location.reload();
        })
        .catch(err => {
          console.log("Error deleting", err);
          alert("Error deleting post");
        });
    }
  }

  handleSubmit() {
    let mf2 = this.state.mf2;
    let titleEditor = this.state.titleEditor;
    let contentEditor = this.state.contentEditor;

    const title = titleEditor ? titleEditor.origElements.innerText : null; // This method makes sure we get a string
    const content = contentEditor ? contentEditor.getContent() : null;
    if (title) {
      mf2.properties.name = [title];
    }
    if (content) {
      mf2.properties.content = [content];
    }

    if (titleEditor) {
      titleEditor.destroy();
      titleEditor = null;
    }
    if (contentEditor) {
      contentEditor.destroy();
      contentEditor = null;
    }

    let update = {
      replace: {}
    };

    Object.keys(mf2.properties).forEach(key => {
      const value = mf2.properties[key];
      const ogValue = this.state.originalProperties[key];
      if (value && value[0] && (!ogValue || !ogValue[0] || ogValue != value)) {
        update.replace[key] = value;
      }
    });

    if (Object.keys(update.replace).length) {
      micropub
        .update(window.location.href, update)
        .then(res => {
          this.setState({
            open: false,
            titleEditor,
            contentEditor
          });
          window.location.reload();
        })
        .catch(err => {
          console.log(err);
          this.setState({
            open: false,
            titleEditor,
            contentEditor
          });
          alert("Error updating post: " + err.message);
        });
    } else {
      alert("Nothing appears to be updated");
    }
  }

  loadEditor() {
    const postEl = this.props.post;
    let contentEl = templateUtils.getContentEl(postEl);
    let titleEl = templateUtils.getTitleEl(postEl);
    let titleEditor = this.state.titleEditor;
    let contentEditor = this.state.contentEditor;
    if (!contentEl) {
      alert("Error finding your content to edit.");
    }
    micropub
      .querySource(window.location.href)
      .then(post => {
        if (post && post.properties) {
          this.setState({
            mf2: post,
            originalProperties: Object.assign({}, post.properties)
          });
        }
        if (
          post.properties &&
          post.properties.name &&
          post.properties.name[0]
        ) {
          titleEl.innerText = post.properties.name[0];
        }
        if (
          post.properties &&
          post.properties.content &&
          post.properties.content[0]
        ) {
          const content = post.properties.content[0];
          if (typeof content == "object" && content.html) {
            contentEl.innerHTML = content.html;
          } else if (typeof content == "string") {
            contentEl.innerText = content;
          }
        }
        contentEditor = new MediumEditor(contentEl, {
          placeholder: {
            text: "Insert post content here"
          }
        });
        titleEditor = new MediumEditor(titleEl, {
          toolbar: false,
          placeholder: {
            text: "Title"
          }
        });
        this.setState({
          titleEditor,
          contentEditor
        });
      })
      .catch(err => {
        console.log("Query error", err);
        alert("Error running query source on your post");
      });
    // editor.subscribe("editableInput", (event, editable) => {
    // });
  }

  render() {
    if (this.state.open) {
      const shownProperties = Object.keys(this.state.mf2.properties).filter(
        key => key != "name" && key != "content"
      );
      shownProperties.push("post-status");
      shownProperties.push("visibility");
      shownProperties.push("mp-slug");
      return (
        <React.Fragment>
          <Group>
            <Button onClick={this.handleSubmit}>Save Post</Button>
            <Button onClick={() => this.setState({ popoutOpen: true })}>
              ⚙
            </Button>
            <Button onClick={this.handleDelete}>🗑</Button>
          </Group>
          <Popout open={this.state.popoutOpen}>
            <PopoutForm
              onChange={mf2 => this.setState({ mf2 })}
              properties={this.state.mf2.properties}
              shownProperties={shownProperties}
            />
          </Popout>
        </React.Fragment>
      );
    } else {
      return <Button onClick={this.handleEdit}>Edit Post</Button>;
    }
  }
}

export default PostEditor;