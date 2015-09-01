import uniq from 'lodash/array/uniq';
import difference from 'lodash/array/difference';

// TODO: Separate collection link and value link

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function linkState (component, name, options) {
    options = Object.assign({
        unique: false
    }, options);

    return {
        value: component.state[name],
        requestChange: function (value) {
            component.setState({[name]: value});
        },
        requestAppend: function (...valuesToAppend) {
            let newValues = valuesToAppend.concat(component.state[name]);
            if (options.unique) {
                newValues = uniq(newValues);
            }

            component.setState({[name]: newValues});
        },
        requestRemove: function (...valuesToRemove) {
            let value = component.state[name];
            value = difference(value, valuesToRemove);
            component.setState({[name]: value});
        }
    }
}

export function getLink (component, name) {
    // TODO: Make sure prop types are defined
    let componentClass = component.constructor;
    let propTypes = componentClass.propTypes || {};
    if (!propTypes[name]) {
        throw new Error(`getLink: '${componentClass.name}' component should define a ${name} prop type`);
    }

    let link = component.props[name + 'Link'];
    if (!link) {
        let capName = capitalizeFirstLetter(name);

        function makeRequestMethod(action) {
            return function perform(...values) {
                let methodName = 'on' + capName + action;
                let method = component.props[methodName];
                if (!method) {
                    throw new Error(`getLink error: Instance of component ${component.constructor.name} does not have a ${methodName} prop defined by its parent.`);
                }
                method(...values);
            }
        }

        link = {
            value: component.props[name],
            requestChange: makeRequestMethod('Change'),
            requestAppend: makeRequestMethod('Append'),
            requestRemove: makeRequestMethod('Remove')
        };
    }

    return link;
}
