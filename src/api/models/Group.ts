import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    OneToMany,
    BeforeInsert,
} from 'typeorm';
import { GroupMessage, GroupUser, User } from '.';

@Entity('group')
export default class Group extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    picture: string;

    @Column('uuid')
    created_by: string;

    @Column('uuid')
    leader_id: string;

    @Column({ nullable: true })
    last_message_time: Date;

    @Column({ unsigned: true })
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @ManyToOne(_ => User, user => user.created_groups, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @ManyToOne(_ => User, user => user.groups_as_leader, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'leader_id' })
    leader: User;

    @OneToMany(_ => GroupUser, users => users.group)
    @JoinColumn({ name: 'group_id' })
    users: GroupUser[];

    @OneToMany(_ => GroupMessage, message => message.group)
    @JoinColumn({ name: 'group_id' })
    messages: GroupMessage[];

    @BeforeInsert()
    private beforeInsert() {
        const date = new Date();

        this.created_at = date;
        this.last_message_time = date;
    }
}
