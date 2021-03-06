import * as React from 'react';
import cc         from 'classcat';
import {
  Droppable,
  Draggable,
  DroppableProvided,
  DroppableStateSnapshot,
  DragStart,
  DragDropContext,
  DropResult,
  DraggableProvided,
  DraggableStateSnapshot,
}                 from 'react-beautiful-dnd';
import decorate, { StyleProps, WithStyle }  from './styles';
import {Observe}  from 'rewire-core';
import Icon       from 'material-ui/Icon';
import {omit}     from 'rewire-common';

// function shadeColor(color: string, percent: number) {
//   const f = parseInt(color.slice(1) , 16);
//   const t = percent < 0 ? 0 : 255;
//   const p = percent < 0 ? percent * -1 : percent;
//   const R = f >> 16;
//   const G = f >> 8 & 0x00FF;
//   const B = f & 0x0000FF;
//   return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
// }


export const styles = {
  'item-container': {
    display: 'flex',
    flex: '1',
    // height: 48,
    alignItems: 'center'
  },
  item: {
    display    : 'flex',
    alignItems : 'center',
    minHeight  : 48,
    margin     : 0,
    // paddingLeft: '8px',
    '& .drag-handle': {
      height: 24,
      paddingRight: 4,
      color: '#0002',
    },
    '&:focus': {
      backgroundColor: '#ccc2',
      outline: 'none'
    }
  },
  'droppable-container': {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'background-color 0.1s ease, opacity 0.1s ease',
    userSelect: 'none',
    '&.is-dragging-over': {
      filter: 'brightness(110%)'
    },
    '&.is-drop-disabled': {
      opacity: 0.5
    }
 },
 'scroll-container': {
   position: 'relative',
   overflowX: 'hidden',
   overflowY: 'auto',
 }
};

export interface IItem {
  id: string;
}

export type Styles = StyleProps<typeof styles>;

export type ListItemProps = {
  items          : IItem[];
  showDragHandle?: boolean;
  listRenderer?  : React.SFC<any>;
  itemRenderer?  : (item: IItem) => JSX.Element;
  autoFocusId?   : string;
} & Styles;

export type ItemProps = {
  showDragHandle?: boolean;
  autoFocus?     : boolean;
  dragProvided   : DraggableProvided;
  itemRenderer   : (item: IItem) => JSX.Element
  item           : IItem;
} & Styles;

export class Item extends React.PureComponent<ItemProps> {
  node?: HTMLDivElement;
  componentDidMount() {
    if (!this.props.autoFocus) {
      return;
    }
    if (this.node) this.node.focus();
  }

  setFocus = (evt: React.MouseEvent<any>) => {
    let element = evt.target as any;
    if (this.props.showDragHandle) {
      element.focus();
    } else {
      element.parentNode.focus();
    }
  }

  render() {
    const {item, dragProvided, classes, showDragHandle, itemRenderer} = this.props;

    if (showDragHandle || (showDragHandle === undefined)) {
      return (
        <Observe render={() => (
          <div ref={(ref) => { dragProvided.innerRef(ref); this.node = ref as HTMLDivElement; }} onClick={this.setFocus} tabIndex={0} className={classes.item} {...dragProvided.draggableProps as any}>
            <div className='drag-handle' {...omit(dragProvided.dragHandleProps, 'onDragStart', 'onDragStop')}>
              <Icon>reorder</Icon>
            </div>
            {itemRenderer(item)}
          </div>
        )} />
      );
    }
    return (
      <Observe render={() => (
        <div ref={dragProvided.innerRef} className={classes.item} {...dragProvided.draggableProps} {...omit(dragProvided.dragHandleProps, 'onDragStart', 'onDragStop')}>
          <div className={classes['item-container']} onClick={this.setFocus} >
            {itemRenderer(item)}
          </div>
        </div>
      )} />
    );
  }
}

export class ListItems extends React.PureComponent<ListItemProps> {
  render() {
    // const List         = this.props.listRenderer || React.Fragment;
    const itemRenderer = this.props.itemRenderer || ((item: IItem) => (item as any).name);
    return (
      <Observe render={() =>
        <>{
          this.props.items.map((item: any, index: number) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                <div>
                  <Item dragProvided={dragProvided} showDragHandle={this.props.showDragHandle} itemRenderer={itemRenderer} classes={this.props.classes} theme={this.props.theme} autoFocus={item.id === this.props.autoFocusId} item={item} />
                  {dragProvided.placeholder}
                </div>
            )}
            </Draggable>
          ))
        }</>
      } />
    );
  }
}

export type SortableListProps = {
  listId         : string,
  listType?      : string,
  autoFocusId?   : string,
  scrollable?    : boolean,
  isDropDisabled?: boolean,
  listRenderer?  : React.SFC<any>;
  itemRenderer?  : (item: IItem) => JSX.Element;
  style?         : Object,
  showDragHandle?: boolean,
  items          : IItem[],
};

const manager: Record<string, any> = {};

class SortableListInternal extends React.PureComponent<SortableListProps & Styles> {
  componentWillMount () {
    manager[this.props.listType + this.props.listId] = this.props.items;
  }

  componentWillUnmount () {
    delete manager[this.props.listType + this.props.listId];
  }

  render() {
    const {scrollable, listRenderer, itemRenderer, showDragHandle, isDropDisabled, listId, listType, style, items, classes, autoFocusId} = this.props;
    const listProps = listRenderer ? {...this.props, style: {display: 'flex', flexDirection: 'column', width: '100%'}} : undefined;
    const List      = listRenderer || React.Fragment;
    return (
      <Droppable droppableId={listId} type={listType} isDropDisabled={isDropDisabled}>
        {(dropProvided: DroppableProvided, dropSnapshot: DroppableStateSnapshot) => (
          <List {...listProps}>
          <div
            className={cc({[classes['droppable-container']]: true, [classes['scroll-container']]: (scrollable || (scrollable === undefined)), 'is-dragging-over': dropSnapshot.isDraggingOver, 'is-drop-disabled': isDropDisabled})}
            style={style}
            {...(dropProvided as any).droppableProps}
          >
            <div ref={dropProvided.innerRef} style={{height: 'auto'}}>
              <ListItems
                items={items}
                showDragHandle={showDragHandle}
                listRenderer={listRenderer}
                autoFocusId={autoFocusId}
                classes={classes}
                theme={this.props.theme}
                itemRenderer={itemRenderer}
              />
            </div>
          </div>
          </List>
        )}
      </Droppable>
    );
  }
}
export const SortableList = decorate(styles)(SortableListInternal);

export interface Props {
  direction?: 'row' | 'column';
  onDragStart?(initial: DragStart): void;
  onDragEnd?(result: DropResult): void;
}

const containerStyles = {
  root: {
    display  : 'flex',
    margin   : 0,
    padding  : 0,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'column',
    '&.row': {
      flexDirection: 'row'
    }
  }
};

class SortableContainer extends React.PureComponent<WithStyle<typeof containerStyles, Props>> {
  onDragEnd = (result: DropResult) => {
    if (!result.destination || !this.props.children) {
      return;
    }

    let source      = manager[result.type + result.source.droppableId];
    let destination = manager[result.type + result.destination.droppableId];

    if (!source || !destination) {
      return;
    }

    destination.splice(result.destination.index, 0, source.splice(result.source.index, 1)[0]);
    if (this.props.onDragEnd) {
      this.props.onDragEnd.call(this, result);
    }
  }

  render() {
    return (
      <DragDropContext
        onDragStart={this.props.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <div style={this.props.style} className={cc({[this.props.classes.root]: true, row: this.props.direction === 'row'})}>
          {this.props.children}
        </div>
      </DragDropContext>
    );
  }
}

export default decorate(containerStyles)(SortableContainer);

